/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcrypt'
import httpStatus from 'http-status'
import { RowDataPacket } from 'mysql2'
import connection from '../../../config/db'
import ApiError from '../../../errors/ApiError'
import { paginationHelpers } from '../../../helper/paginationHelper'
import { IGenericResponse } from '../../../interfaces/common'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { UserQueries } from '../../../queries/userQueries'
import { IUserFilter, UserFilterableFields, UserSearchableFields } from './user.constant'
import { IUser } from './user.interface'


const createUser = async (user: IUser): Promise<Partial<IUser>> => {
  try {
    
    const emailCheckQuery = `SELECT * FROM users WHERE email = ?`;
    const [existingUser] = await connection.promise().query(emailCheckQuery, [user.email]);

    if ((existingUser as RowDataPacket[]).length > 0) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists');
    }

  
    const role = user.role;
    const checkRoleQuery = `SELECT id FROM roles WHERE name = ?`;
    const [roleResult]: any = await connection.promise().query(checkRoleQuery, [role]);

    if (roleResult.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Role "${role}" does not exist`);
    }

    const roleId = roleResult[0].id; 


    const hashedPassword = await bcrypt.hash(user.password, 12);
    const insertUserQuery = UserQueries.CREATE_USER;
    const [userResult]: any = await connection.promise().query(insertUserQuery, [user.name, user.email, hashedPassword]);

    const userId = userResult.insertId;

    const assignRoleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`;
    await connection.promise().query(assignRoleQuery, [userId, roleId]);

    return {
      name: user.name,
      email: user.email,
      role: role,
    };

  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.statusCode === 409) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already exists');
    } else if (error.statusCode === 400) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating user');
  }
};

const getAllUsers = async (
  filters: IUserFilter,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IUser[]>> => {
  try {
    const { searchTerm, ...filtersData } = filters
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(paginationOptions)

    const whereConditions: string[] = []
    const queryParams: any[] = []

    whereConditions.push(`u.deleted_at IS NULL`)

    if (searchTerm) {
      const searchConditions = UserSearchableFields.filter(
        field => field !== 'searchTerm'
      )
        .map(field => `u.${field} LIKE ?`)
        .join(' OR ')
      whereConditions.push(`(${searchConditions})`)
      queryParams.push(...UserSearchableFields.map(() => `%${searchTerm}%`))
    }

    if (Object.keys(filtersData).length > 0) {
      Object.entries(filtersData).forEach(([field, value]) => {
        if (UserFilterableFields.includes(field)) {
          whereConditions.push(`u.${field} = ?`)
          queryParams.push(value)
        }
      })
    }

    const sortConditions =
      sortBy && UserFilterableFields.includes(sortBy)
        ? `ORDER BY u.${sortBy} ${sortOrder || 'ASC'}`
        : ''

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const query = `
      SELECT u.id, u.name, u.email, r.name AS role 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      ${sortConditions}
      LIMIT ? OFFSET ?`
    
    queryParams.push(limit, skip)

    const [results] = await connection.promise().query(query, queryParams)
    const users = results as RowDataPacket[]

    const mappedUsers: IUser[] = users.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    }))

    const countQuery = `SELECT COUNT(*) AS total FROM users u ${whereClause}`
    const countParams = queryParams.slice(0, -2)

    const [countResults] = await connection.promise().query(countQuery, countParams)
    const total = (countResults as RowDataPacket[])[0].total

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: mappedUsers,
    }
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unable to retrieve users'
    )
  }
}

const getUserById = async (id: number): Promise<Partial<IUser> | null> => {
  try {
    const getUserQuery = UserQueries.GET_USER_BY_ID
    const [rows]: any[] = await connection.promise().query(getUserQuery, [id])

    if (rows.length === 0) {
      return null  
    }

    return rows[0] 
  } catch (error: any) {
    console.error('Error retrieving user:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error retrieving user',
      error.stack || ''
    )
  }
}

const updateUser = async (
  id: number,
  userUpdates: Partial<IUser>
): Promise<IUser | null> => {
  try {
    const fields = Object.keys(userUpdates)
      .filter(key => key !== 'role' && userUpdates[key as keyof IUser] !== undefined)
      .map(key => `${key} = ?`)

    const values = Object.values(userUpdates).filter(
      value => value !== undefined && value !== userUpdates.role 
    )
    values.push(id)

    if (fields.length === 0 && !userUpdates.role) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No updates provided')
    }

    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`
    const [updateResult] = await connection.promise().query(query, values)
    const { affectedRows } = updateResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }

    if (userUpdates.role) {
      const roleQuery = `SELECT id FROM roles WHERE name = ?`
      const [roleRows]:any = await connection.promise().query(roleQuery, [userUpdates.role])

      if (roleRows.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found')
      }

      const roleId = roleRows[0].id
      const userRoleQuery = `UPDATE user_roles SET role_id = ? WHERE user_id = ?`
      await connection.promise().query(userRoleQuery, [roleId, id])
    }

    const [rows] = await connection.promise().query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, r.name AS role, u.updated_at
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching updated user'
      )
    }

    const updatedUser = rows[0]
    const { password, ...responseUser } = updatedUser 
    return responseUser as IUser
  } catch (error: any) {
    console.error('Error updating user:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error updating user',
      error.stack || ''
    )
  }
}

const deleteUser = async (id: number): Promise<IUser> => {
  try {
    const [rows] = await connection.promise().query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }

    const user = rows[0] as IUser
    const deleteQuery = UserQueries.DELETE_USER
    const [deleteResult] = await connection.promise().query(deleteQuery, [id])

    const { affectedRows } = deleteResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error soft deleting user')
    }
    return user
  } catch (error: any) {
    console.log(error, ' line 231')
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error soft deleting user')
  }
}

const restoreUser = async (id: number): Promise<IUser> => {
  try {
    const [rows] = await connection.promise().query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found or not deleted')
    }

    const user = rows[0] as IUser

    const restoreQuery =UserQueries.RESTORE_USER
    const [restoreResult] = await connection.promise().query(restoreQuery, [id])

    const { affectedRows } = restoreResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error restoring user')
    }

    return user;
  } catch (error: any) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error restoring user')
  }
}


export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser
}

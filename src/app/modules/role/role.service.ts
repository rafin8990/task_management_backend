import httpStatus from 'http-status'
import connection from '../../../config/db'
import ApiError from '../../../errors/ApiError'
import { RoleQueries } from '../../../queries/roleQueries'
import { IRole } from './role.interface'

const createRole = async (role: IRole): Promise<Partial<IRole>> => {
  try {
    const { name } = role
    const checkRoleQuery = `SELECT * FROM roles WHERE name = ?`;
        const [existingRole]: any = await connection.promise().query(checkRoleQuery, [name]);

        if (existingRole.length > 0) {
            throw new ApiError(httpStatus.CONFLICT, "Role already exists");
        }
    const insertRoleQuery = RoleQueries.CREATE_ROLE
    const [roleResult]: any = await connection
      .promise()
      .query(insertRoleQuery, [name])
    return {
      id: roleResult.insertId,
      name,
    }
  } catch (error: any) {
    if (error.statusCode === 409) {
      throw new ApiError(httpStatus.CONFLICT, 'Role already exists')
    }
    console.log(error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating user')
  }
}

export const RoleService = {
  createRole,
}

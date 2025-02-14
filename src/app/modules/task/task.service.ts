import httpStatus from 'http-status'
import { RowDataPacket } from 'mysql2'
import connection from '../../../config/db'
import ApiError from '../../../errors/ApiError'
import { paginationHelpers } from '../../../helper/paginationHelper'
import { IGenericResponse } from '../../../interfaces/common'
import { IPaginationOptions } from '../../../interfaces/pagination'
import {
    ITaskFilter,
    taskFilterableFields,
    taskSearchableFields,
} from './task.constant'
import { ITask } from './task.interface'

const createTask = async (task: ITask): Promise<Partial<ITask>> => {
  const taskQueries =
    'INSERT INTO tasks (title, description, status, user_id, due_date, priority, position, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  const values = [
    task.title,
    task.description,
    task.status,
    task.user_id,
    task.due_date,
    task.priority,
    task.position,
    task.is_archived,
  ]
  const [taskResult]: any = await connection
    .promise()
    .query(taskQueries, values)

  const newTask = {
    id: taskResult.insertId,
    ...task,
  }
  return newTask
}
const getTaskById = async (id: number): Promise<ITask | null> => {
  const taskQuery = `
      SELECT id, title, description, status, user_id, due_date, priority, position, is_archived, created_at, updated_at, deleted_at 
      FROM tasks 
      WHERE id = ?`

  try {
    const [rows]: any = await connection.promise().query(taskQuery, [id])
    return rows[0] || null
  } catch (error) {
    console.error('Error fetching task:', error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch tasks'
    )
  }
}

const getTasksByUserId = async (userId: number): Promise<ITask[]> => {
  const taskQuery = `
      SELECT id, title, description, status, user_id, due_date, priority, position, is_archived, created_at, updated_at, deleted_at 
      FROM tasks 
      WHERE user_id = ?`

  try {
    const [rows]: any = await connection.promise().query(taskQuery, [userId])
    return rows as ITask[]
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch tasks'
    )
  }
}

const getAllTasks = async (
  filters: ITaskFilter,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<ITask[]>> => {
  try {
    const { searchTerm, ...filtersData } = filters
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(paginationOptions)

    const whereConditions: string[] = []
    const queryParams: any[] = []

    whereConditions.push(`t.deleted_at IS NULL`)

    if (searchTerm) {
      const searchConditions = taskSearchableFields
        .filter(field => field !== 'searchTerm')
        .map(field => `t.${field} LIKE ?`)
        .join(' OR ')
      whereConditions.push(`(${searchConditions})`)
      queryParams.push(...taskSearchableFields.map(() => `%${searchTerm}%`))
    }

    if (Object.keys(filtersData).length > 0) {
      Object.entries(filtersData).forEach(([field, value]) => {
        if (taskFilterableFields.includes(field)) {
          whereConditions.push(`t.${field} = ?`)
          queryParams.push(value)
        }
      })
    }

    const sortConditions =
      sortBy && taskFilterableFields.includes(sortBy)
        ? `ORDER BY t.${sortBy} ${sortOrder || 'ASC'}`
        : ''

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const query = `
        SELECT t.id, t.title, t.description, t.status, t.user_id, t.due_date, t.priority, t.position, t.is_archived, t.created_at, t.updated_at 
        FROM tasks t
        ${whereClause}
        ${sortConditions}
        LIMIT ? OFFSET ?`

    queryParams.push(limit, skip)

    const [results] = await connection.promise().query(query, queryParams)
    const tasks = results as RowDataPacket[]

    const mappedTasks: any = tasks.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      user_id: row.user_id,
      due_date: row.due_date,
      priority: row.priority,
      position: row.position,
      is_archived: row.is_archived,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    const countQuery = `SELECT COUNT(*) AS total FROM tasks t ${whereClause}`
    const countParams = queryParams.slice(0, -2)

    const [countResults] = await connection
      .promise()
      .query(countQuery, countParams)
    const total = (countResults as RowDataPacket[])[0].total

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: mappedTasks,
    }
  } catch (error) {
    console.error('Error in getAllTasks:', error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unable to retrieve tasks'
    )
  }
}

const updateTask = async (
  id: number,
  taskUpdates: Partial<ITask>
): Promise<ITask | null> => {
  try {
    const fields = Object.keys(taskUpdates)
      .filter(key => taskUpdates[key as keyof ITask] !== undefined)
      .map(key => `t.${key} = ?`)

    const values = Object.values(taskUpdates).filter(
      value => value !== undefined
    )
    values.push(id)

    if (fields.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No updates provided')
    }

    const taskQuery = `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`
    const [existingTask] = await connection.promise().query(taskQuery, [id])

    if ((existingTask as RowDataPacket[]).length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found')
    }

    const query = `UPDATE tasks t SET ${fields.join(
      ', '
    )}, updated_at = NOW() WHERE t.id = ? AND t.deleted_at IS NULL`
    const [updateResult] = await connection.promise().query(query, values)

    const { affectedRows } = updateResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Task not found or no changes made'
      )
    }

    const [rows] = await connection.promise().query<RowDataPacket[]>(
      `SELECT t.id, t.title, t.description, t.status, t.user_id, t.due_date, t.priority, t.position, t.is_archived, t.created_at, t.updated_at
         FROM tasks t
         WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching updated task'
      )
    }

    const updatedTask = rows[0]
    return updatedTask as ITask
  } catch (error: any) {
    console.error('Error updating task:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error updating task',
      error.stack || ''
    )
  }
}

const softDeleteTask = async (id: number): Promise<ITask | null> => {
  try {
    const taskQuery = `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`
    const [existingTask] = await connection.promise().query(taskQuery, [id])

    if ((existingTask as RowDataPacket[]).length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found')
    }

    const query = `UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`
    const [updateResult] = await connection.promise().query(query, [id])

    const { affectedRows } = updateResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Task not found or already deleted'
      )
    }

    const [rows] = await connection.promise().query<RowDataPacket[]>(
      `SELECT id, title, description, status, user_id, due_date, priority, position, is_archived, created_at, updated_at, deleted_at
         FROM tasks WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching task data after soft delete'
      )
    }

    const deletedTask = rows[0]
    return deletedTask as ITask
  } catch (error: any) {
    console.error('Error soft deleting task:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error soft deleting task',
      error.stack || ''
    )
  }
}

const restoreTask = async (id: number): Promise<ITask | null> => {
  try {
    const taskQuery = `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NOT NULL`
    const [existingTask] = await connection.promise().query(taskQuery, [id])

    if ((existingTask as RowDataPacket[]).length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found or not deleted')
    }

    const restoreQuery = `UPDATE tasks SET deleted_at = NULL WHERE id = ?`
    const [restoreResult] = await connection.promise().query(restoreQuery, [id])

    const { affectedRows } = restoreResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to restore task'
      )
    }

    const [rows] = await connection.promise().query<RowDataPacket[]>(
      `SELECT id, title, description, status, user_id, due_date, priority, position, is_archived, created_at, updated_at, deleted_at
         FROM tasks WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching restored task'
      )
    }

    const restoredTask = rows[0]
    return restoredTask as ITask
  } catch (error: any) {
    console.error('Error restoring task:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error restoring task',
      error.stack || ''
    )
  }
}

const hardDeleteTask = async (id: number): Promise<ITask | null> => {
  try {
    const taskQuery = `SELECT * FROM tasks WHERE id = ?`
    const [existingTask] = await connection
      .promise()
      .query<RowDataPacket[]>(taskQuery, [id])

    if (existingTask.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found')
    }

    const deleteQuery = `DELETE FROM tasks WHERE id = ?`
    const [deleteResult] = await connection.promise().query(deleteQuery, [id])

    const { affectedRows } = deleteResult as { affectedRows: number }

    if (affectedRows === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to delete task'
      )
    }

    const deletedTask = existingTask[0]
    return deletedTask as ITask
  } catch (error: any) {
    console.error('Error hard deleting task:', error.message || error)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error hard deleting task',
      error.stack || ''
    )
  }
}

export const TaskService = {
  createTask,
  getTaskById,
  getTasksByUserId,
  getAllTasks,
  updateTask,
  softDeleteTask,
  restoreTask,
  hardDeleteTask
}

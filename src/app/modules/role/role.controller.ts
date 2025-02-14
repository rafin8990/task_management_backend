import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import { RoleService } from './role.service'
import sendResponse from '../../../shared/sendResponse'
import httpStatus from 'http-status'

const createRole = catchAsync(async (req: Request, res: Response) => {
  const role = req.body
  const result = await RoleService.createRole(role)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Role created successfully',
    success: true,
    data: result,
  })
})

export const RoleController = {
  createRole,
}

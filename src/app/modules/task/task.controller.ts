import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { TaskService } from './task.service';

const createTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.body;
  const result = await TaskService.createTask(task);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Task created successfully',
    success: true,
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const paginationOptions = req.query;
  const tasks = await TaskService.getAllTasks(filters as any, paginationOptions as any);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Tasks retrieved successfully',
    success: true,
    data: tasks,
  });
});

const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const task = await TaskService.getTaskById(taskId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Task retrieved successfully',
    success: true,
    data: task,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const taskUpdates = req.body;
  const task = await TaskService.updateTask(taskId, taskUpdates);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Task updated successfully',
    success: true,
    data: task,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const deletedTask = await TaskService.softDeleteTask(taskId);
  sendResponse(res, {
    statusCode: httpStatus.OK, 
    message: 'Task deleted successfully',
    success: true,
    data: deletedTask,
  });
});

const restoreTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const restoredTask = await TaskService.restoreTask(taskId);
  sendResponse(res, {
    statusCode: httpStatus.OK, 
    message: 'Task restored successfully',
    success: true,
    data: restoredTask,
  });
});

const hardDeleteTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const deletedTask = await TaskService.hardDeleteTask(taskId);
  sendResponse(res, {
    statusCode: httpStatus.OK, 
    message: 'Task hard deleted successfully',
    success: true,
    data: deletedTask,
  });
});

export const TaskController = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
  hardDeleteTask,
};

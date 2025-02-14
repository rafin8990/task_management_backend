import express from 'express';

import { TaskController } from './task.controller';

const router = express.Router();

router.post('/', TaskController.createTask);
router.get('/', TaskController.getAllTasks);
router.get('/:id', TaskController.getTaskById);
router.patch('/:id', TaskController.updateTask);
router.patch('/delete/:id', TaskController.deleteTask);
router.patch('/restore/:id', TaskController.restoreTask);
router.delete('/:id', TaskController.hardDeleteTask);

export const taskRoutes = router;

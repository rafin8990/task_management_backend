import express from 'express';
import { RoleController } from './role.controller';

const router = express.Router()

router.post('/', RoleController.createRole);

export const roleRoutes = router

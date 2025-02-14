import express from 'express'
import { LoginRoutes } from '../modules/auth/auth.route'
import { roleRoutes } from '../modules/role/role.route'
import { userRoutes } from '../modules/users/user.route'
import { taskRoutes } from '../modules/task/task.route'

const router = express.Router()

const moduleRoutes = [
  {
    path: '/role',
    route: roleRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: LoginRoutes,
  },
  {
    path: '/task',
    route: taskRoutes,
  },
]
moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router

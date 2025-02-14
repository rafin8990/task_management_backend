import bcrypt from 'bcrypt'
import httpStatus from 'http-status'
import jwt from 'jsonwebtoken'
import config from '../../../config'
import ApiError from '../../../errors/ApiError'
import { jwtHelpers } from '../../../helper/jwtHelper'
import connection from '../../../config/db'

import {
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
} from './auth.interface'
const loginUser = async (payload: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = payload

  try {
    const getUserQuery = `SELECT u.*, r.name AS role 
                          FROM users u 
                          JOIN user_roles ur ON u.id = ur.user_id 
                          JOIN roles r ON ur.role_id = r.id 
                          WHERE u.email = ?`

    const [userRows]: any = await connection
      .promise()
      .query(getUserQuery, [email])

    if (userRows.length === 0) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password')
    }

    const user = userRows[0]

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password')
    }

    const role = user.role

    const accessToken = jwtHelpers.createToken(
      {
        id: user.id,
        email: user.email,
        role: role,
      },
      config.jwt_secret as string,
      config.jwt_expires_in as string
    )

    const refreshToken = jwtHelpers.createToken(
      {
        id: user.id,
        email: user.email,
        role: role,
      },
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string
    )

    return {
      accessToken,
      refreshToken,
    }
  } catch (error: any) {
    console.error('Error logging in user:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Login failed')
  }
}

const refreshAccessToken = async (
  refreshToken: string
): Promise<IRefreshTokenResponse> => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      config.jwt_refresh_secret as string
    )
    if (!decoded || typeof decoded !== 'object' || !decoded.email) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token')
    }

    const { email, role, id } = decoded
    const newAccessToken = jwtHelpers.createToken(
      { email, role, id },
      config.jwt_secret as string,
      config.jwt_expires_in as string
    )

    return {
      accessToken: newAccessToken,
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to refresh token')
  }
}

export const AuthService = {
  loginUser,
  refreshAccessToken,
}

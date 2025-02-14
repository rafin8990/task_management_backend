import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const { ...loginData } = req.body;
  
    const result = await AuthService.loginUser(loginData);
  
    const { refreshToken, ...others } = result;
  
    const cookieOptions = {
      secure: config.env === 'production',
      httpOnly: true,
    };
  
    res.cookie('refreshToken', refreshToken, cookieOptions);
  
    if ('refreshToken' in result) {
        delete result.refreshToken
      }
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: others,
    });
  });


  const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
    }
    const result = await AuthService.refreshAccessToken(refreshToken);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });


  
  export const AuthController={
    loginUser,
    refreshToken,
  }
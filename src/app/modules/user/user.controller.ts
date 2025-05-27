import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User created successfully',
      data: result,
    });
  },
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const role = req.params.role;

  const result = await UserService.getUsersFromDB(role);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Users are retrieved successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedStatus = req.body.status;
  console.log(updatedStatus);
  const result = await UserService.updateUserStatusToDB(id, updatedStatus);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User status updated successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    let image = getSingleFilePath(req.files, 'image');

    const data = {
      image,
      ...req.body,
    };
    const result = await UserService.updateProfileToDB(user, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  },
);

const deleteUserFromDB = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await UserService.deleteUserFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User is deleted successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  getUsers,
  updateUserStatus,
  updateProfile,
  deleteUserFromDB,
};

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';

// const createUser = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { ...userData } = req.body;
//     const result = await UserService.createUserToDB(userData);

//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'User created successfully',
//       data: result,
//     });
//   },
// );

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;
    const image = getSingleFilePath(req.files, 'image');
    const drivingLicense = getSingleFilePath(req.files, 'drivingLicense');

    const payload = {
      ...userData,
      image,
      drivingLicense,
    };

    const result = await UserService.createUserToDB(payload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User registered successfully',
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

const getVehicle = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getVehicleFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vehicle data retrieved successfully',
    data: result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const result = await UserService.getUsersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Users are retrieved successfully',
    data: result,
  });
});

const getRiders = catchAsync(async (req, res) => {
  const result = await UserService.getRidersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider are retrieved successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await UserService.getUserByIdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User is retrieved successfully',
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

const updateVehicle = catchAsync(async (req, res) => {
  const user = req.user;
  const updatedData = req.body;
  let drivingLicense = '';

  if (
    req.files &&
    'drivingLicense' in req.files &&
    req.files.drivingLicense[0]
  ) {
    drivingLicense = `/images/${req.files.drivingLicense[0].filename}`;
  }

  const data = {
    ...updatedData,
    drivingLicense,
  };

  const result = await UserService.updateVehicleToDB(user, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vehicle updated successfully',
    data: result,
  });
});

const adminUpdateUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profileData = req.body;
    const userId = req.params.userId;

    let image = '';
    if (req.files && 'image' in req.files && req.files.image[0]) {
      image = `/images/${req.files.image[0].filename}`;
    }

    const data = {
      ...profileData,
      image,
    };

    const result = await UserService.adminUpdateUserProfileToDB(userId, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully by admin',
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
  getVehicle,
  getUsers,
  getRiders,
  getUserById,
  updateUserStatus,
  updateProfile,
  updateVehicle,
  adminUpdateUserProfile,
  deleteUserFromDB,
};

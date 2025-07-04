import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser, IVehicle } from './user.interface';
import { User } from './user.model';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const forbiddenRoles = ['ADMIN', 'SUPER_ADMIN'];

  if (payload.role && forbiddenRoles.includes(payload.role)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not allowed to register with this role',
    );
  }

  // validate for rider role extra fields
  if (payload.role === 'RIDER') {
    const requiredRiderFields = [
      'nid',
      'vehicleType',
      'vehicleModel',
      'registrationNumber',
      'drivingLicense',
    ];
    for (const field of requiredRiderFields) {
      if (!payload[field as keyof IUser]) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `${field} is required for rider role`,
        );
      }
    }
  } else {
    // not rider, remove any rider-only fields if present to avoid saving unwanted data
    delete payload.nid;
    delete payload.vehicleType;
    delete payload.vehicleModel;
    delete payload.registrationNumber;
    delete payload.drivingLicense;
  }

  const createUser = await User.create(payload);

  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  // filter out rider only fields from response if not rider
  let userData = createUser.toObject();
  if (payload.role !== 'RIDER') {
    delete userData.nid;
    delete userData.vehicleType;
    delete userData.vehicleModel;
    delete userData.registrationNumber;
    delete userData.drivingLicense;
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: userData.name,
    otp: otp,
    email: userData.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: userData._id },
    { $set: { authentication } },
  );

  return userData;
};

const getUserProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const getUsersFromDB = async () => {
  const result = await User.find({ role: 'USER' });
  if (result.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No user found in the database',
    );
  }
  return result;
};

const getRidersFromDB = async () => {
  const result = await User.find({ role: 'RIDER' });
  if (result.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No rider found in the database',
    );
  }
  return result;
};

const getUserByIdFromDB = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No user found in this ID');
  }
  return result;
};

const updateUserStatusToDB = async (id: string, status: string) => {
  const result = await User.findByIdAndUpdate(
    { _id: id },
    { status },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update user status');
  }
  return result;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  if (payload.role || payload.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You dont't change the role or verified",
    );
  }
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(payload.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const updateVehicleToDB = async (
  user: JwtPayload,
  payload: Partial<IVehicle>,
) => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // unlink file here
  if (payload.drivingLicense) {
    unlinkFile(payload.drivingLicense);
  }

  const result = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return result;
};

const getVehicleFromDB = async (user: JwtPayload): Promise<Partial<IUser>> => {
  const { id } = user;

  const isExistUser = await User.findById(id).select(
    'vehicleType vehicleModel registrationNumber drivingLicense',
  );

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const adminUpdateUserProfileToDB = async (
  userId: string,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const isExistUser = await User.isExistUserById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Unlink old image if new image is uploaded
  if (payload.image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  const result = await User.findOneAndUpdate({ _id: userId }, payload, {
    new: true,
  });

  return result;
};

const deleteUserFromDB = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete user');
  }
  return result;
};

export const UserService = {
  createUserToDB,
  getUsersFromDB,
  getRidersFromDB,
  getVehicleFromDB,
  getUserByIdFromDB,
  getUserProfileFromDB,
  updateUserStatusToDB,
  adminUpdateUserProfileToDB,
  updateVehicleToDB,
  updateProfileToDB,
  deleteUserFromDB,
};

import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IAdmin } from './admin.interface';

const createAdminToDB = async (payload: IAdmin) => {
  const result = await User.create({ ...payload, verified: true });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin');
  }
  return result;
};

const getAdminsFromDB = async () => {
  const result = await User.find({ role: 'ADMIN' });
  if (result.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No admin found in database');
  }
  return result;
};

const updateAdminToDB = async (id: string, payload: Partial<IAdmin>) => {
  const result = await User.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
  });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update admin');
  }
  return result;
};

const updateAdminStatusToDB = async (id: string, status: string) => {
  const result = await User.findByIdAndUpdate(
    { _id: id },
    { status },
    { new: true }
  );
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to update admin status'
    );
  }
  return result;
};

const deleteAdminFromDB = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete admin');
  }
  return result;
};

export const AdminServices = {
  createAdminToDB,
  getAdminsFromDB,
  updateAdminToDB,
  updateAdminStatusToDB,
  deleteAdminFromDB,
};

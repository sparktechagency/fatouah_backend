import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IUser } from '../user/user.interface';

const createAdminToDB = async (payload: IUser) => {
  const createAdmin: any = await User.create(payload);
  if (!createAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
  }
  if (createAdmin) {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true },
      { new: true },
    );
  }
  return createAdmin;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
  const admins = await User.find({ role: 'ADMIN' }).select(
    'name email profile role status contact location',
  );
  return admins;
};

const updateAdminStatusToDB = async (id: string, status: string) => {
  const result = await User.findByIdAndUpdate(
    { _id: id },
    { status },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update status');
  }
  return result;
};

const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
  const isExistAdmin = await User.findByIdAndDelete(id);
  if (!isExistAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
  }
  return;
};

export const AdminServices = {
  createAdminToDB,
  getAdminFromDB,
  updateAdminStatusToDB,
  deleteAdminFromDB,
};

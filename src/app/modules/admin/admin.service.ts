import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IUser } from '../user/user.interface';
import bcrypt from 'bcrypt';
import config from '../../../config';

const createAdminToDB = async (payload: IUser) => {
  const createAdmin: any = await User.create({ ...payload, role: 'ADMIN' });
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

const getAdminFromDB = async () => {
  const result = await User.find({ role: 'ADMIN',status:"active" }).select(
    'name email profile role status contact location',
  );
  return result;
};

const getAllAdminsFromDB=async()=>{
  const result=await User.find({role:"ADMIN"}).select("name email profile role status contact location")
  if(!result||result.length===0){
    throw new ApiError(StatusCodes.BAD_REQUEST,"No admins are found in database")
  };
  return result;
}

const updateAdminToDB = async (id: string, payload: Partial<IUser>) => {
  const { name, email, password } = payload;


  // check if admin is exist
  const isExist = await User.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  const updatePayload: Partial<IUser> = {};

  if (name) updatePayload.name = name;

  if (email) {
    const isEmailTaken = await User.findOne({
      email,
      _id: { $ne: id },
    });

    if (isEmailTaken) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is already in use');
    }
    updatePayload.email = email;
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );
    updatePayload.password = hashedPassword;
  }

  const result = await User.findByIdAndUpdate(id, updatePayload, { new: true });

  return result;
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
  getAllAdminsFromDB,
  updateAdminToDB,
  updateAdminStatusToDB,
  deleteAdminFromDB,
};

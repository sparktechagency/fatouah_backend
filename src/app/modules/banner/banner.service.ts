import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import { IBanner } from './banner.interface';
import { Banner } from './banner.model';
import ApiError from '../../../errors/ApiError';

const createBannerToDB = async (payload: IBanner): Promise<IBanner> => {
  const result = await Banner.create(payload);
  if (!result) {
    unlinkFile(payload.image);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to created banner');
  }

  return result;
};

const getBannersFromDB = async () => {
  const result = await Banner.find();
  if (result.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No banner found in database');
  }
  return result;
};

const updateBannerToDB = async (id: string, payload: Partial<IBanner>) => {
  const result = await Banner.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
  });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update banner');
  }
  return result;
};

const deleteBannerFromDB = async (id: string) => {
  const result = await Banner.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete banner');
  }
  return result;
};

export const BannerServices = {
  createBannerToDB,
  getBannersFromDB,
  updateBannerToDB,
  deleteBannerFromDB,
};

import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { JwtPayload } from 'jsonwebtoken';

const createReviewToDB = async (
  payload: IReview,
  user: JwtPayload
): Promise<IReview> => {
  // check if the user is exists
  const rider: any = await User.findById(payload.rider);
  if (!rider) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found in the database');
  }

  payload.customer = user.id;

  if (payload.rating) {
    // check the rating is valid;
    const rating = Number(payload.rating);
    if (rating < 1 || rating > 5) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Rating is invalid');
    }
  }

  const result = await Review.create(payload);

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create review');
  }

  return result;
};

export const ReviewServices = {
  createReviewToDB,
};

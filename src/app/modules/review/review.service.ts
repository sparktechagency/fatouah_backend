import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { JwtPayload } from 'jsonwebtoken';

// const createReviewToDB = async (payload: IReview, user: JwtPayload) => {
//   const { rider, rating } = payload;

//   payload.customer = user.id;
//   const customer = user.id;

//   // validate rating
//   if (rating < 1 || rating > 5) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Rating must be between 1 and 5',
//     );
//   }

//   // check if customer exists
//   const isCustomerExist = await User.findById(customer);
//   if (!isCustomerExist) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found in database');
//   }

//   // check if rider exists
//   const isRiderExist = await User.findById(rider);
//   if (!isRiderExist) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found in database');
//   }

//   // check if user is already review this rider
//   const existingReview = await Review.findOne({ customer, rider });
//   if (existingReview) {
//     throw new ApiError(
//       StatusCodes.CONFLICT,
//       'You have already reviewed this rider',
//     );
//   }

//   const result = await Review.create(payload);

//   return result;
// };


const createReviewToDB = async (payload: IReview, user: JwtPayload, orderId: string) => {
  const { rider, rating } = payload;

  payload.customer = user.id;
  const customer = user.id;

  // validate rating
  if (rating < 1 || rating > 5) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Rating must be between 1 and 5',
    );
  }

  // check if customer exists
  const isCustomerExist = await User.findById(customer);
  if (!isCustomerExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found in database');
  }

  // check if rider exists
  const isRiderExist = await User.findById(rider);
  if (!isRiderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found in database');
  }

  // check if orderId is provided
  if (!orderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Order ID must be provided');
  }

  // check if user already reviewed this rider for this order
  const existingReview = await Review.findOne({ customer, rider, order: orderId });
  if (existingReview) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'You have already reviewed this rider for this order',
    );
  }

  // add orderId to the payload before creating review
  payload.order = orderId;

  const result = await Review.create(payload);

  return result;
};


export const getRiderReviewsFromDB = async (id: string) => {
  const reviews = await Review.find({ rider: id }).populate('customer', 'name').sort({ createdAt: -1 });;

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews === 0
      ? 0
      : parseFloat(
        (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        ).toFixed(1),
      );

  return {
    totalReviews,
    averageRating,
    reviews,
  };
};

export const ReviewServices = {
  createReviewToDB,
  getRiderReviewsFromDB,
};

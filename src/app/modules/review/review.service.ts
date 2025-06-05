import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { JwtPayload } from 'jsonwebtoken';
import { Order } from '../order/order.model';

const createCustomerReviewToRider = async (
  payload: IReview,
  user: JwtPayload,
  orderId: string,
) => {
  const { rider, rating } = payload;
  const customer = user.id;

  if (!orderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Order ID must be provided');
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Rating must be between 1 and 5',
    );
  }

  // check existence
  const [isCustomerExist, isRiderExist, isOrderExist] = await Promise.all([
    User.findById(customer),
    User.findById(rider),
    Order.findById(orderId),
  ]);

  if (!isCustomerExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }

  if (!isRiderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found');
  }

  if (!isOrderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  // check if already reviewed
  const existingReview = await Review.findOne({
    customer,
    rider,
    order: orderId,
  });
  if (existingReview) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Already reviewed this rider for this order',
    );
  }

  const reviewPayload = {
    ...payload,
    customer,
    order: orderId,
  };

  const result = await Review.create(reviewPayload);
  return result;
};

const createRiderReviewToCustomer = async (
  payload: IReview,
  user: JwtPayload,
  orderId: string,
) => {
  const { customer, rating } = payload;
  const rider = user.id;

  if (!orderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Order ID must be provided');
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Rating must be between 1 and 5',
    );
  }

  // check existence
  const [isCustomerExist, isRiderExist, isOrderExist] = await Promise.all([
    User.findById(customer),
    User.findById(rider),
    Order.findById(orderId),
  ]);

  if (!isCustomerExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }

  if (!isRiderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found');
  }

  if (!isOrderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  // check if already reviewed
  const existingReview = await Review.findOne({
    customer,
    rider,
    order: orderId,
  });
  if (existingReview) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Already reviewed this customer for this order',
    );
  }

  const reviewPayload = {
    ...payload,
    rider,
    order: orderId,
  };

  const result = await Review.create(reviewPayload);
  return result;
};

const getRiderReviewsFromDB = async (id: string) => {
  const reviews = await Review.find({ rider: id })
    .populate('customer', 'name')
    .populate('rider', 'name vehicleType')
    .sort({ createdAt: -1 });

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
  getRiderReviewsFromDB,
  createCustomerReviewToRider,
  createRiderReviewToCustomer,
};

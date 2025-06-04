import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReviewServices } from './review.service';


const createCustomerReviewToRider = catchAsync(async (req, res) => {
  const reviewData = req.body;
  const user = req.user;
  const orderId = req.params.orderId;
  const result = await ReviewServices.createCustomerReviewToRider(reviewData, user, orderId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Customer review created successfully",
    data: result,
  })
})

const createRiderReviewToCustomer = catchAsync(async (req, res) => {
  const reviewData = req.body;
  const user = req.user;
  const orderId = req.params.orderId;
  const result = await ReviewServices.createRiderReviewToCustomer(reviewData, user, orderId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Rider review created successfully",
    data: result,
  })
})

const getRiderReviews = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ReviewServices.getRiderReviewsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Reviews are retrieved successfully',
    data: result,
  });
});

export const ReviewControllers = {
  getRiderReviews,
  createCustomerReviewToRider,
  createRiderReviewToCustomer
};

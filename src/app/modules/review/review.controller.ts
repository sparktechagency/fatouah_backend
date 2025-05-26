import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReviewServices } from './review.service';

const createReview = catchAsync(async (req, res) => {
  const reviewData = req.body;
  const user = req.user;
  const result = await ReviewServices.createReviewToDB(reviewData, user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Review is created successfully',
    data: result,
  });
});

export const ReviewControllers = {
 createReview,
};

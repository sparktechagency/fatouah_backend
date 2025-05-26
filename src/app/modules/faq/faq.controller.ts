import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Faq } from './faq.model';

const createFaq = catchAsync(async (req, res) => {
  const faqData = req.body;
  const result = await Faq.create(faqData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Faq created successfully',
    data: result,
  });
});

export const FaqControllers={
    createFaq,
}

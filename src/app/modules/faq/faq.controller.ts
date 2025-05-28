import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Faq } from './faq.model';
import { FaqServices } from './faq.service';

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

const getFaqs = catchAsync(async (req, res) => {
  const result = await FaqServices.getFaqsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Faqs are retrieved successfully',
    data: result,
  });
});

const updateFaq = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedPayload = req.body;
  const result = await FaqServices.updateFaqToDB(id, updatedPayload);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Faq updated successfully',
    data: result,
  });
});

const deleteFaq = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await FaqServices.deleteFaqFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Faq deleted successfully',
    data: result,
  });
});

const deleteMultipleFaqs = catchAsync(async (req, res) => {
  const { ids } = req.body;

  const result = await FaqServices.deleteMultipleFaqsFromDB(ids);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Faqs are deleted successfully',
    data: result,
  });
});

export const FaqControllers = {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
  deleteMultipleFaqs,
};

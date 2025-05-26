import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleServices } from './rule.service';

const createPrivacyPolicy = catchAsync(async (req, res) => {
  const privacyData = req.body;
  const result = await RuleServices.createPrivacyPolicyToDB(privacyData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Privacy policy created successfully',
    data: result,
  });
});

const getPrivacyPolicy = catchAsync(async (req, res) => {
  const result = await RuleServices.getPrivacyPolicyFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Retrieved privacy policy data',
    data: result,
  });
});

const createTermsAndCondition = catchAsync(async (req, res) => {
  const termsData = req.body;
  const result = await RuleServices.createTermsAndConditionToDB(termsData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Terms and condition created successfully',
    data: result,
  });
});

const getTermsAndCondition = catchAsync(async (req, res) => {
  const result = await RuleServices.getTermsAndConditionFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Retrieved terms and condition',
    data: result,
  });
});

const createAbout = catchAsync(async (req, res) => {
  const aboutData = req.body;
  const result = await RuleServices.createAboutToDB(aboutData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'About created successfully',
    data: result,
  });
});

const getAbout = catchAsync(async (req, res) => {
  const result = await RuleServices.getAboutFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'About retrieved successfully',
    data: result,
  });
});

export const RuleControllers = {
  createPrivacyPolicy,
  getPrivacyPolicy,
  createTermsAndCondition,
  getTermsAndCondition,
  createAbout,
  getAbout,
};

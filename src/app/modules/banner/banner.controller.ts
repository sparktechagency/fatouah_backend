import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BannerServices } from './banner.service';

const createBanner = catchAsync(async (req, res) => {
  const bannerData = req.body;
  let image = '';
  if (req.files && 'image' in req.files && req.files.image[0]) {
    image = `/images/${req.files.image[0].filename}`;
  }

  const data = {
    ...bannerData,
    image,
  };

  const result = await BannerServices.createBannerToDB(data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Banner is created successfully',
    data: result,
  });
});

const getBanners = catchAsync(async (req, res) => {
  const result = await BannerServices.getBannersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Banners are retrieved successfully',
    data: result,
  });
});

const getAllBanners = catchAsync(async (req, res) => {
  const result = await BannerServices.getAllBannersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Banners are retrieved successfully',
    data: result,
  });
});

const updateBanner = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedPayload = req.body;
  const result = await BannerServices.updateBannerToDB(id, updatedPayload);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Banner updated successfully',
    data: result,
  });
});

const updateBannerStatus = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const result = await BannerServices.updateBannerStatusToDB(id, status);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Banner status updated successfully',
    data: result,
  });
});

const deleteBanner = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await BannerServices.deleteBannerFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Banner is deleted successfully',
    data: result,
  });
});

export const BannerControllers = {
  createBanner,
  getBanners,
  getAllBanners,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
};

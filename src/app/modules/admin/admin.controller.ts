import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminServices } from './admin.service';

const createAdmin = catchAsync(async (req, res) => {
  const adminData = req.body;
  const result = await AdminServices.createAdminToDB(adminData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Admin created successfully',
    data: result,
  });
});

const getAdmins = catchAsync(async (req, res) => {
  const result = await AdminServices.getAdminFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Admins are retrieved successfully',
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllAdminsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'All admins are retrieved successfully',
    data: result,
  });
});

const updateAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const updatedPayload = req.body;

  const result = await AdminServices.updateAdminToDB(id, updatedPayload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Admin is updated successfully',
    data: result,
  });
});

const updateAdminStatus = catchAsync(async (req, res) => {
  const id = req.params.id;
  const statusData = req.body.status;
  const result = await AdminServices.updateAdminStatusToDB(id, statusData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Admin status updated successfully',
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await AdminServices.deleteAdminFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin Deleted Successfully',
    data: result,
  });
});

export const AdminControllers = {
  createAdmin,
  getAdmins,
  getAllAdmins,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
};

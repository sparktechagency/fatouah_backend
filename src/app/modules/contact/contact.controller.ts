import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ContactServices } from './contact.service';

const createContact = catchAsync(async (req, res) => {
  const contactData = req.body;
  const result = await ContactServices.createContactToDB(contactData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Contact is created successfully',
    data: result,
  });
});

const getContact = catchAsync(async (req, res) => {
  const result = await ContactServices.getContactFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Contact is retrieved successfully",
    data: result
  })
})

export const ContactControllers = {
  createContact,
  getContact,
};

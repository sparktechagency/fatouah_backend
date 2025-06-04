import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';

const createContactToDB = async (payload: IContact) => {
  // check if contact exist
  const existingContact = await Contact.findOne();
  if (existingContact) {
    const updatedData = { ...existingContact.toObject(), ...payload };

    const result = await Contact.findByIdAndUpdate(
      existingContact._id,
      updatedData,
      { new: true },
    );
    return result;
  } else {
    if (!payload.email || !payload.phone || !payload.location) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Email, Phone and Location fields are required',
      );
    }
    const result = await Contact.create(payload);
    return result;
  }
};

const getContactFromDB = async () => {
  const result = await Contact.find();
  if (!result || result.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No contact data found');
  }
  return result;
};

export const ContactServices = {
  createContactToDB,
  getContactFromDB,
};

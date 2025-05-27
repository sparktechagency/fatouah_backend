import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';

const createContactToDB = async (payload: IContact) => {
  const isExistContact = await Contact.findOne(payload);
  if (isExistContact) {
    const result = await Contact.findOneAndUpdate();
  }
};

export const ContactServices = {
  createContactToDB,
};

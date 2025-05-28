import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IFaq } from './faq.interface';
import { Faq } from './faq.model';

const createFaqToDB = async (payload: IFaq) => {
  const result = await Faq.create(payload);
  return result;
};

const getFaqsFromDB = async () => {
  const faqs = await Faq.find();
  return faqs;
};

const updateFaqToDB = async (id: string, payload: Partial<IFaq>) => {
  const result = await Faq.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
  });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to updated Faq');
  }
  return result;
};

const deleteFaqFromDB = async (id: string) => {
  const result = await Faq.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Faq');
  }
  return result;
};



export const FaqServices = {
  createFaqToDB,
  getFaqsFromDB,
  updateFaqToDB,
  deleteFaqFromDB,
};

import ApiError from '../../../errors/ApiError';
import { IFaq } from './faq.interface';
import { Faq } from './faq.model';

const createFaqToDB = async (payload: IFaq) => {
  const result = await Faq.create(payload);
  return result;
};

const faqsFromDB = async (): Promise<IFaq[]> => {
    const faqs = await Faq.find({});
    return faqs;
};
  


export const FaqServices = {
  createFaqToDB,
};

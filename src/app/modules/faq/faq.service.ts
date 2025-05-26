import ApiError from '../../../errors/ApiError';
import { IFaq } from './faq.interface';
import { Faq } from './faq.model';

const createFaqToDB = async (payload: IFaq) => {
  const result = await Faq.create(payload);
  return result;
};

const getAllFaqsFromDB = async () => {
  const result = await Faq.find();
  if (result.length === 0) {
    throw new ApiError(404, 'No Faq found in database');
  }
  return result;
};

const updateFaqById=async(id:string,payload:Partial<IFaq>)=>{
    
}

export const FaqServices = {
  createFaqToDB,
  getAllFaqsFromDB,
};

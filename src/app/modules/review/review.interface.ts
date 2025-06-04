import { Schema } from 'mongoose';

export type IReview = {
  customer?: Schema.Types.ObjectId;
  rider?: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  order?: string;
};

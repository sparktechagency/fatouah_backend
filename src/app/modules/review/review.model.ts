import { model, Schema, Types } from 'mongoose';
import { IReview } from './review.interface';

const reviewSchema = new Schema<IReview>(
  {
    customer: {
      type: Types.ObjectId,
      ref: 'User',
    },
    rider: {
      type: Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Types.ObjectId,
      ref: 'Order',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Review = model<IReview>('Review', reviewSchema);

import { model, Schema, Types } from 'mongoose';
import { IReview } from './review.interface';

const reviewSchema = new Schema<IReview>(
  {
    customer: {
      type: Types.ObjectId,
      required: true,
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
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Review = model<IReview>('Review', reviewSchema);

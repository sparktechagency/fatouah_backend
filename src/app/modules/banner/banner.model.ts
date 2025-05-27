import { model, Schema } from 'mongoose';
import { IBanner } from './banner.interface';

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inActive'],
        message: '{VALUE} is not a valid status',
      },
      default:"active"
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Banner = model<IBanner>('Banner', bannerSchema);

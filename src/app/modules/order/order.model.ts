import { model, Schema, Types } from 'mongoose';
import { IOrder } from './order.interface';
import { Parcel_Types, RIDES } from '../../../enums/order';

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
    },
    user: {
      type: Types.ObjectId,
      ref: 'User',
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere',
      },
    },
    destinationLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere',
      },
    },
    receiversName: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
    },
    additionalInformation: {
      type: String,
    },
    parcelType: {
      type: String,
      enum: Object.values(Parcel_Types),
      required: true,
    },
    parcelValue: {
      type: Number,
      required: true,
    },
    parcelWeight: {
      type: Number,
      required: true,
    },
    ride: {
      type: String,
      enum: Object.values(RIDES),
    },
    distance: {
      type: Number,
    },
    deliveryCharge: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
    },
    riderAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Order = model('Order', orderSchema);

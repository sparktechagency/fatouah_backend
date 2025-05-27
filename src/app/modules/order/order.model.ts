import { model, Schema, Types } from 'mongoose';
import { IOrder } from './order.interface';
import { Parcel_Types, RIDES } from '../../../enums/order';

const orderSchema = new Schema<IOrder>(
  {
    pickupLocation: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number, Number],
        required: true,
      },
    },
    deliveryLocation: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number, Number],
        required: true,
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
    customerId: {
      type: Types.ObjectId,
      ref: 'User',
    },
    assignedRider: {
      type: Types.ObjectId,
      ref: 'User',
    },
    transactionId: {
      type: String,
    },
    assignedAt: {
      type: String,
    },
    pickedAt: {
      type: String,
    },
    startAt: {
      type: String,
    },
    deliveredAt: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Order = model('Order', orderSchema);

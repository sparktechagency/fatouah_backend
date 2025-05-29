import { Schema, model } from 'mongoose';
import { IDelivery } from './delivery.interface';

const deliverySchema = new Schema<IDelivery>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rider: { type: Schema.Types.ObjectId, ref: 'User' },
    riderCurrentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: '2dsphere',
      },
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'ASSIGNED',
        'ACCEPTED',
        'ARRIVED',
        'PICKED_UP',
        'ON_THE_WAY',
        'DELIVERED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    timestamps: {
      assignedAt: Date,
      acceptedAt: Date,
      arrivedAt: Date,
      pickedAt: Date,
      startedAt: Date,
      cancelledAt: Date,
      deliveredAt: Date,
    },
    attempts: [
      {
        rider: { type: Schema.Types.ObjectId, ref: 'User' },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const Delivery = model<IDelivery>('Delivery', deliverySchema);

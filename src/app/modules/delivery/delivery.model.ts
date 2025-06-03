import { Schema, model } from 'mongoose';
import { IDelivery } from './delivery.interface';

const deliverySchema = new Schema<IDelivery>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rider: { type: Schema.Types.ObjectId, ref: 'User' },
    // riderCurrentLocation: {
    //   type: {
    //     type: String,
    //     enum: ['Point'],
    //     default: 'Point',
    //   },
    //   coordinates: {
    //     type: [Number],
    //     default: [0, 0],
    //     index: '2dsphere',
    //   },
    // },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'ASSIGNED',
        'ACCEPTED',
        'ARRIVED_PICKED_UP',
        'STARTED',
        'ARRIVED_DESTINATION',
        'DELIVERED',
        'REJECTED',
        'CANCELLED',
        'FAILED',
      ],
      default: 'REQUESTED',
    },
    timestamps: {
      requestedAt: Date,
      assignedAt: Date,
      acceptedAt: Date,
      arrivedPickedUpAt: Date,
      arrivedDestinationAt: Date,
      startedAt: Date,
      cancelledAt: Date,
      deliveredAt: Date,
      failedAt: Date,
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

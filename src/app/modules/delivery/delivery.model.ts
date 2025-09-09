import { Schema, Types, model } from 'mongoose';
import { IDelivery } from './delivery.interface';

const deliverySchema = new Schema<IDelivery>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderId: {
      type: String,
    },
    rider: { type: Schema.Types.ObjectId, ref: 'User' },
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
    rejectedRiders: [{ type: Types.ObjectId, ref: 'User' }],
    isActive: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

export const Delivery = model<IDelivery>('Delivery', deliverySchema);

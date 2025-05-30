import { Types } from 'mongoose';

export interface DeliveryAttempt {
  rider: Types.ObjectId;
  attemptedAt?: Date;
}

export interface IDelivery {
  order: Types.ObjectId;
  rider?: Types.ObjectId;
  status:
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'STARTED'
  | 'ARRIVED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';
  timestamps: {
    requestedAt?: Date;
    assignedAt?: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    arrivedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    rejectedAt?: Date;
  };
  attempts: DeliveryAttempt[];
}

// Delivery status types
type DeliveryStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'STARTED'
  | 'ARRIVED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

// Timestamp keys per status for convenience
export const statusTimestampsMap: Record<DeliveryStatus, keyof IDelivery['timestamps']> = {
  REQUESTED: 'requestedAt',
  ASSIGNED: 'assignedAt',
  ACCEPTED: 'acceptedAt',
  STARTED: 'startedAt',
  ARRIVED: 'arrivedAt',
  PICKED_UP: 'pickedUpAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
  REJECTED: 'rejectedAt',
};

export interface UpdateStatusOptions {
  deliveryId: string;
  status: DeliveryStatus;
  riderId?: string;
  userId?: string;
}

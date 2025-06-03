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
  | 'ARRIVED_PICKED_UP'
  | 'STARTED'
  | 'ARRIVED_DESTINATION'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';
  timestamps: {
    requestedAt?: Date;
    assignedAt?: Date;
    acceptedAt?: Date;
    arrivedPickedUpAt?: Date;
    startedAt?: Date;
    arrivedDestinationAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    rejectedAt?: Date;
    failedAt?: Date;
  };
  attempts: DeliveryAttempt[];
}

// Delivery status types
type DeliveryStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ARRIVED_PICKED_UP'
  | 'STARTED'
  | 'ARRIVED_DESTINATION'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';

// Timestamp keys per status for convenience
export const statusTimestampsMap: Record<
  DeliveryStatus,
  keyof IDelivery['timestamps']
> = {
  REQUESTED: 'requestedAt',
  ASSIGNED: 'assignedAt',
  ACCEPTED: 'acceptedAt',
  ARRIVED_PICKED_UP: 'arrivedPickedUpAt',
  STARTED: 'startedAt',
  ARRIVED_DESTINATION: "arrivedDestinationAt",
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
  REJECTED: 'rejectedAt',
  FAILED: 'failedAt',
};

export interface UpdateStatusOptions {
  deliveryId: string;
  status: DeliveryStatus;
  riderId?: string;
  userId?: string;
  session?: any;
}

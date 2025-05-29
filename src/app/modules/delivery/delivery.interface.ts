import { Types } from 'mongoose';

export interface DeliveryAttempt {
  rider: Types.ObjectId;
  attemptedAt?: Date;
}

// export interface IRiderLocation {
//   type: 'Point';
//   coordinates: [number, number]; // [longitude, latitude]
// }

export interface IDelivery {
  order: Types.ObjectId;
  rider?: Types.ObjectId;
  // riderCurrentLocation?: IRiderLocation;
  status:
    | 'REQUESTED'
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'ARRIVED'
    | 'PICKED_UP'
    | 'ON_THE_WAY'
    | 'DELIVERED'
    | 'REJECTED'
    | 'CANCELLED';
  timestamps: {
    assignedAt?: Date;
    acceptedAt?: Date;
    arrivedAt?: Date;
    pickedAt?: Date;
    startedAt?: Date;
    cancelledAt?: Date;
    deliveredAt?: Date;
  };
  attempts: DeliveryAttempt[];
}

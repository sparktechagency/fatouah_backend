import { Schema } from 'mongoose';
import { Parcel_Types, RIDES } from '../../../enums/order';

export type IOrder = {
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  deliveryLocation: {
    address: string;
    coordinates: [number, number];
  };
  receiversName: string;
  contact: string;
  additionalInformation?: string;
  parcelType: Parcel_Types;
  parcelValue: number;
  parcelWeight: number;
  ride: RIDES;
  distance: number;
  deliveryCharge: number;
  customerId: Schema.Types.ObjectId;
  assignedRider: Schema.Types.ObjectId;
  transactionId: string;
  status: 'PENDING' | 'ASSIGNED' | 'ARRIVED' | 'STARTED' | 'DELIVERED';
  assignedAt?: string;
  pickedAt?: string;
  startAt?: string;
  deliveredAt?: string;
};

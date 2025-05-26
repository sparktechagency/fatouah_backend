import { Schema } from 'mongoose';
import { Parcel_Types, RIDES } from '../../../enums/order';

export type IOrder = {
  pickupLocation: {
    address: string;
    coordinates: [Number];
  };
  deliveryLocation: {
    address: string;
    coordinates: [Number];
  };
  receiversName: string; 
  contact: string;
  additionalInformation?: string;
  parcelType: Parcel_Types;
  parcelValue: Number;
  parcelWeight: number; 
  ride: RIDES;
  distance: number;
  deliveryCharge: number;
  customerId: Schema.Types.ObjectId;
  assignedRider: Schema.Types.ObjectId;
  transactionId: string;
  assignedAt?: string;
  pickedAt?: string;
  startAt?: string;
  deliveredAt?: string;
};

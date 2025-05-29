import { Schema } from 'mongoose';
import { Parcel_Types, RIDES } from '../../../enums/order';

export type IOrder = {
  user: Schema.Types.ObjectId;
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  destinationLocation: {
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
};

import { Schema } from 'mongoose';
import { Parcel_Types, RIDES } from '../../../enums/order';

export type IOrder = {
  _id: string;
  orderId: string;
  user: Schema.Types.ObjectId;
  pickupLocation: {
    type?: 'Point';
    address: string;
    coordinates: [number, number];
  };
  destinationLocation: {
    type?: 'Point';
    address: string;
    coordinates: [number, number];
  };
  receiversName: string;
  image: string;
  contact: string;
  additionalInformation?: string;
  parcelType: Parcel_Types;
  parcelValue: number;
  minParcelWeight: number;
  maxParcelWeight: number;
  ride: RIDES;
  distance: number;
  deliveryCharge: number;
  commissionAmount: number;
  riderAmount: number;
};

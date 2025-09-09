import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
import { VEHICLE_TYPE } from './user.constant';

export type IUser = {
  name: string;
  role?: USER_ROLES;
  contact: string;
  countryCode: string;
  email: string;
  password: string;
  location?: string;
  geoLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  image?: string;
  status: 'active' | 'delete';
  verified: boolean;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  // rider
  nid?: string;
  vehicleType?: VEHICLE_TYPE;
  vehicleModel?: string;
  registrationNumber?: string;
  drivingLicense?: string;
  isOnline: boolean;
  stripeAccountId: string;
  stripeValidated:boolean;
};

export type IVehicle = {
  vehicleType?: VEHICLE_TYPE;
  vehicleModel?: string;
  registrationNumber?: string;
  drivingLicense?: string;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;

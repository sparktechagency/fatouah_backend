import { z } from 'zod';

const createOrderZodSchema = z.object({
  body: z.object({
    user: z.string().optional(),
    pickupLocation: z.object({
      address: z.string({ required_error: 'Pickup address is required' }),
      coordinates: z.array(
        z.number({ required_error: 'Coordinates is required' }),
      ),
    }),
    destinationLocation: z.object({
      address: z.string({ required_error: 'Delivery address is required' }),
      coordinates: z.array(
        z.number({ required_error: 'Coordinates is required' }),
      ),
    }),
    receiversName: z.string({ required_error: 'Receivers Name is required' }),
    contact: z
      .string({
        message: 'Contact is required',
      })
      .min(10, { message: 'Contact must be at least 10 digits' }) // country-specific min
      .max(15, { message: 'Contact can be at most 15 digits' })
      .regex(/^\+?\d+$/, { message: 'Contact must be a valid number' }),
    additionalInformation: z.string().optional(),
    // parcel types
    parcelValue: z.number({ message: 'Parcel value is required' }).int({ message: 'Parcel value must be an integer' }),
    // parcelWeight: z.number({ required_error: 'Parcel weight is required' }),
    minParcelWeight: z.number({
      required_error: 'Minimum parcel weight is required',
    }),
    maxParcelWeight: z.number({
      required_error: 'Maximum parcel weight is required',
    }),
    // ride
    distance: z.number().optional(),
    deliveryCharge: z.number().optional(),
  }),
});

export const OrderValidation = {
  createOrderZodSchema,
};

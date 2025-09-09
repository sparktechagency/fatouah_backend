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
    contact: z.string({ required_error: 'Contact is required' }),
    additionalInformation: z.string().optional(),
    // parcel types
    parcelValue: z.number({ required_error: 'Parcel value is required' }),
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

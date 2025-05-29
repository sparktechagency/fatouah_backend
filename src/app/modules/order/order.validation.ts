import { z } from 'zod';

const createOrderZodSchema = z.object({
  body: z.object({
    user: z.string(),
    pickupLocation: z.object({
      address: z.string({ required_error: 'Pickup address is required' }),
      coordinates: z.array(
        z.number({ required_error: 'Coordinates is required' }),
      ),
    }),
    deliveryLocation: z.object({
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
    parcelWeight: z.number({ required_error: 'Parcel weight is required' }),
    // ride
    distance: z.number().optional(),
    deliveryCharge: z.number().optional(),
    customerId: z.string({ required_error: 'Customer ID is required' }),
    assignedRider: z.string({ required_error: 'Rider ID is required' }),
    transactionId: z.string().optional(),
    assignedAt: z.string().optional(),
    pickedAt: z.string().optional(),
    startAt: z.string().optional(),
    deliveredAt: z.string().optional(),
  }),
});

export const OrderValidation = {
  createOrderZodSchema,
};

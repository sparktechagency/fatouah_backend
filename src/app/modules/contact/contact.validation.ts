import { z } from 'zod';

const createContactZodSchema = z.object({
  body: z.object({
    phone: z.string({ required_error: 'Phone number is required' }),
    email: z.string({ required_error: 'Email is required' }),
    location: z.string({ required_error: 'Location is required' }),
  }),
});

export const ContactValidation = {
  createContactZodSchema,
};

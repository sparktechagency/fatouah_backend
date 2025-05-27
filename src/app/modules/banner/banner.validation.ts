import { z } from 'zod';

const createBannerZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    image: z.string({ required_error: 'Image is required' }),
    status: z.enum(['active', 'inActive']).default('active'),
  }),
});

export const BannerValidation = {
  createBannerZodSchema,
};

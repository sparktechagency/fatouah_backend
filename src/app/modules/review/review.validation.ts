import { z } from 'zod';

const createReviewZodSchema = z.object({
  body: z.object({
    customer: z.string().optional(),
    rider: z.string({ required_error: 'Rider ID is required' }),
    rating: z.number({ required_error: 'Rating is required' }),
    comment: z.string({ required_error: 'Comment is required' }),
    order: z.string().optional(),
  }),
});

export const ReviewValidation = {
  createReviewZodSchema,
};

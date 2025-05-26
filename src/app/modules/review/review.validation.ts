import { z } from 'zod';

const createReviewZodSchema = z.object({
  body: z.object({
    customer: z.string({ required_error: 'Customer ID is required' }),
    rider: z.string({ required_error: 'Rider ID is required' }),
    rating: z.number({ required_error: 'Rating is required' }),
    comment: z.string({ required_error: 'Comment is required' }),
  }),
});

export const ReviewValidation = {
  createReviewZodSchema,
};

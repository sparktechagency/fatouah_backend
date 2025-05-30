import { Request, Response } from 'express';
import { handleStripeWebhook } from '../../../util/stripeWebHooksHandler';
import sendResponse from '../../../shared/sendResponse';

export async function stripeWebhookController(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  const result = await handleStripeWebhook(req.body, signature);

  if ('alreadyExists' in result) {
    console.log(' Payment already exists:', result);
  } else if ('saved' in result) {
    console.log(result);
  } else {
    console.log(' Webhook ignored (not handled event).');
  }

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Payment webhook',
    data: result,
  });
}

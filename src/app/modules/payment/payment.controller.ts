import { Request, Response } from 'express';
import { handleStripeWebhook } from '../../../util/stripeWebHooksHandler';


export async function stripeWebhookController(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const result = await handleStripeWebhook(req.body, signature);

    res.status(200).json({ received: true, data: result });
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}


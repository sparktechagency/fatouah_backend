import { Request, Response } from 'express';
import { handleStripeWebhook } from '../../../util/stripeWebHooksHandler';
import { createOrGetStripeAccount, createStripeOnboardingLink } from './payment.service';


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


export const createConnectLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const stripeAccountId = await createOrGetStripeAccount(userId);
    const url = await createStripeOnboardingLink(stripeAccountId);

    res.json({ url });
  } catch (error) {
    console.error('Stripe Connect Error:', error);
    res.status(500).json({ error: 'Stripe connect account creation failed' });
  }
};



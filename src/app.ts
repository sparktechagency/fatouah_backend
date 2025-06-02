import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';

import stripe from './config/stripe';
import config from './config';
import {
  createConnectLink,
  stripeWebhookController,
} from './app/modules/payment/payment.controller';
import auth from './app/middlewares/auth';
import { USER_ROLES } from './enums/user';
const app = express();

// ✅ Stripe webhook endpoint
// app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
//   try {
//     const sig = req.headers['stripe-signature'];
//     if (!sig) {
//       return res.status(400)
//     }
//     const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe_webhook_secret!)
//     if (event.type === "payment_intent.succeeded") {
//       const intent = event.data.object;
//       console.log("✅ Payment Intent succeeded with ID:", intent.id);
//     }
//     if (event.type === "customer.created") {
//       const customer = await stripe.customers.retrieve(event.data.object.id);
//       console.log(customer, "customer")

//     } else {
//       console.log("unhandled event", event.type)
//     }
//     return res.sendStatus(200)

//   } catch (err) {
//     console.log("Error handling event", err)
//     return res.sendStatus(400)
//   }
// })
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookController,
);

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static('uploads'));

//router
app.use('/api/v1', router);

// connect stripe account
app.post(
  '/api/v1/stripe/create-connect-link',
  auth(USER_ROLES.RIDER),
  createConnectLink,
);

app.get('/check-balance', async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();

    console.log('🟢 Available Balance:', balance.available);
    console.log('🟡 Pending Balance:', balance.pending);

    return res.status(200).json({
      success: true,
      available: balance.available,
      pending: balance.pending,
    });
  } catch (error) {
    console.error('🔴 Error retrieving balance:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve balance.',
      error: error.message,
    });
  }
});

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `,
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;

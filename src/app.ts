import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';

import stripe from './config/stripe';
import config from './config';
import { stripeWebhookController } from './app/modules/payment/payment.controller';
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
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookController)

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

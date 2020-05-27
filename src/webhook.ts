import { RequestHandler, Response, Request } from "express";
import Stripe from "stripe";
import createHttpError from "http-errors";
import Mail from "nodemailer/lib/mailer";

import { createNewTicket } from "./ticket/db";
import { registerNewCustomer, searchCustomerAPIKey } from "./customer/db";
import { createNewAPIKey } from "./apikey/db";
import { generatePassword, decodeBase64, encodeBase64 } from "./common";
import { PASSWORD_LENGTH, STRIPE_WEBHOOK_SECRET, GB } from "./constants";

const webhookEndpointFactory = (db: any, stripeClient: Stripe, mailTransport: Mail): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];
    if (typeof signature === 'undefined') {
      console.log('signature missing')
      throw createHttpError(400, 'signature is missing');
    }

    let event = null;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw createHttpError(400, 'signature is invalid');
    }

    let mailMsg: Mail.Options;
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const metadata = intent.metadata;

      if (metadata.method === 'new_ticket') {
        const apikey = decodeBase64(metadata.apikey);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const quota = BigInt(metadata.quota) * GB;
        const ticketKey = await createNewTicket(db, apikey, startDate, endDate, quota);
        const customers = await searchCustomerAPIKey(db, apikey);
        if (customers.length !== 1) {
          throw new Error(`something is wrong about apikey ${apikey}`)
        }
        const customer = customers[0];
        mailMsg = {
          from: {
            name: 'Exchangedataset',
            address: "purchases@exchangedataset.cc",
          },
          to: customer.email,
          subject: "Your transaction is complete",
          text: `Thank you for your purchase!\nA purchace of ${metadata.quota}GB ticket for ${encodeBase64(apikey)} is complete.\nThe key of newly created ticket is ${ticketKey}\n\nExchangedataset\nSupport: support@exchangedataset.cc\n<This email is sent by the system. Please do not respond to this email.>`,
        };
      } else if (metadata.method === 'new_customer') {
        const email = metadata.email;
        const password = await generatePassword(PASSWORD_LENGTH);
        const quota = BigInt(metadata.quota) * GB;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const customerKey = await registerNewCustomer(db, email, password);
        const apikey = await createNewAPIKey(db, customerKey);
        await createNewTicket(db, apikey, startDate, endDate, quota);
        mailMsg = {
          from: {
            name: 'Exchangedataset',
            address: "purchases@exchangedataset.cc",
          },
          to: email,
          subject: "API-key and password for your account are generated",
          text: `Thank your for your purchase!\nHere is your new API-key that we have created:\n${encodeBase64(apikey)}\n\nYou can use it to access our API.\nWe have also created your account to access API-key Console.\nHere are the credentials:\nEmail: ${email}\nPassword: ${password}\nConsole is used to purchase new ticket for your API-key.\n\nExchangedataset\nSupport: support@exchangedataset.cc\n<This email is sent by the system. Please do not respond to this email.>`,
        };
      } else {
        throw new Error('unknown method');
      }
    } else {
      // we don't care about other messages
      res.json({ received: true });
      return;
    }

    // returning this will ensure we received this message
    res.json({ received: true });

    await mailTransport.sendMail(mailMsg);
  } catch (e) {
    next(e);
  }
};

export default webhookEndpointFactory;

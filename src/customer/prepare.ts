import { RequestHandler, Response, Request } from "express";
import createHttpError from "http-errors";
import Stripe from "stripe";

import { hasString } from "../common";
import { QUOTA_MAX, calcPrice, EMAIL_REGEX } from "../constants";
import { getCustomerCredential } from "./db";

const prepareCustomerHandlerFactory = (db: any, stripeClient: Stripe): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    hasString(req.body, 'email');
    hasString(req.body, 'quota');
    if (!EMAIL_REGEX.test(req.body.email)) {
      throw createHttpError(400, "email is invalid");
    }
    const email = req.body.email;
    let quota: bigint;
    try {
      quota = BigInt(req.body.quota);
    } catch (e) {
      throw createHttpError(400, "quota must be a string of integer")
    }
    if (quota > QUOTA_MAX) {
      throw createHttpError(400, "quota is too big");
    }
    const price = calcPrice(quota);
    if (price > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw createHttpError(400, "payment price is too big, unsafe to continue");
    }
    // check if this email is already registered
    const credentials = await getCustomerCredential(db, email);
    if (credentials !== null) {
      throw createHttpError(400, "customer with the email is already registered");
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      // amount in stripe is cent based
      amount: Number(price),
      currency: 'usd',
      metadata: {
        method: 'new_customer',
        email,
        quota: quota.toString(),
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    next(e);
  }
};

export default prepareCustomerHandlerFactory;

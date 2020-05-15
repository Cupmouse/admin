import { RequestHandler, Response, Request } from "express";
import createHttpError from "http-errors";
import Stripe from "stripe";

import { hasString, decodeBase64, encodeBase64 } from "../common";
import { QUOTA_MAX, calcPrice, ERR_DONT_HAVE_PERMISSION } from "../constants";
import { getAPIKeyCustomerKey } from "../apikey/db";

const prepareTicketHandlerFactory = (db: any, stripeClient: Stripe): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    hasString(req.body, 'apikey');
    hasString(req.body, 'quota');

    const apikey = decodeBase64(req.body.apikey);
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

    const customerKey = await getAPIKeyCustomerKey(db, apikey);
    if (customerKey === null) {
      // apikey does not exist
      throw createHttpError(400, "API-key does not exist");
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (BigInt(req.session!.customerKey) !== customerKey) {
      throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      // amount in stripe is cent based
      amount: Number(price),
      currency: 'usd',
      metadata: {
        method: 'new_ticket',
        customerKey: customerKey.toString(),
        apikey: encodeBase64(apikey),
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

export default prepareTicketHandlerFactory;

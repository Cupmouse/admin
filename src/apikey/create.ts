import { RequestHandler } from 'express';

import { hasString, encodeBase64 } from '../common';
import createHttpError from 'http-errors';
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from '../constants';
import { createNewAPIKey } from './db';

const createAPIKeyHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'customerKey');
    let customerKey: bigint;
    try {
      customerKey = BigInt(req.body.customerKey);
    } catch (e) {
      throw createHttpError(400, "customerKey must be a string of integer")
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (req.session!.email! !== ADMIN_USER && BigInt(req.session!.customerKey) !== customerKey) {
      throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
    }

    const apikey = await createNewAPIKey(db, customerKey);
    res.json({ key: encodeBase64(apikey) });
  } catch (e) {
    next(e);
  }
};

export default createAPIKeyHandlerFactory;

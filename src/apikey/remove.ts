import { RequestHandler } from 'express';

import { hasString, encodeBase64, decodeBase64 } from '../common';
import createHttpError from 'http-errors';
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from '../constants';
import { getAPIKeyCustomerKey, removeAPIKey } from './db';
import { listAPIKeyTickets } from '../ticket/db';

const removeAPIKeyHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'apikey');
    const apikey = decodeBase64(req.body.apikey);
    
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (req.session!.email! !== ADMIN_USER) {
      const customerKey = await getAPIKeyCustomerKey(db, apikey);
      if (customerKey === null) {
        throw createHttpError(400, `API-Key '${encodeBase64(apikey)}' does not exist`);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (BigInt(req.session!.customerKey) !== customerKey) {
        throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
      }
    }

    if ((await listAPIKeyTickets(db, apikey)).length > 0) {
      // if this apikey has tickets, then it must not delete it (can't)
      throw createHttpError(400, `remove all tickets associated with this API-key before removing it`)
    }
    await removeAPIKey(db, apikey);
  
    res.json({ key: encodeBase64(apikey) });
  } catch (e) {
    next(e);
  }
};

export default removeAPIKeyHandlerFactory;

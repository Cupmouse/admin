import { Request, Response, RequestHandler } from 'express';
import createHttpError from 'http-errors';

import { hasString, decodeBase64, encodeBase64 } from '../common';
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from '../constants';
import { getAPIKeyCustomerKey } from '../apikey/db';
import { removeTicket } from './db';

const removeTicketHandlerFactory = (db: any): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    hasString(req.body, 'apikey');
    hasString(req.body, 'key');
    const apikey = decodeBase64(req.body.apikey);
    let key: bigint;
    try {
      key = BigInt(req.body.key);
    } catch (e) {
      throw createHttpError(400, "key must be a string of integer")
    }
    
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (req.session!.email != ADMIN_USER) {
      const customerKey = await getAPIKeyCustomerKey(db, apikey);
      if (customerKey === null) {
        throw createHttpError(400, `API-Key '${encodeBase64(apikey)}' does not exist`);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (BigInt(req.session!.customerKey) !== customerKey)  {
        throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
      }
    }
  
    await removeTicket(db, apikey, key);
    res.json({ key: key.toString() });
  } catch (e) {
    next(e);
  }
};

export default removeTicketHandlerFactory;

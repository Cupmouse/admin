import { Request, Response, RequestHandler } from 'express';

import { hasString, decodeBase64, encodeBase64 } from '../common';
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from '../constants';
import { getAPIKeyCustomerKey } from '../apikey/db';
import createHttpError from 'http-errors';
import { listAPIKeyTickets } from './db';

const listTicketHandlerFactory = (db: any): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    hasString(req.body, 'apikey');
    const apikey = decodeBase64(req.body.apikey);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (req.session!.email !== ADMIN_USER) {
      const customerKey = await getAPIKeyCustomerKey(db, apikey);
      if (customerKey === null) {
        throw createHttpError(400, `API-Key '${encodeBase64(apikey)}' does not exist`);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (BigInt(req.session!.customerKey) !== customerKey)  {
        throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
      }
    }
  
    const rslt = (await listAPIKeyTickets(db, apikey)).map((row) => {
      return {
        ticketKey: encodeBase64(row.key),
        startDate: row.start_date,
        endDate: row.end_date,
        used: row.used,
        quota: row.quota,
      }
    });
    res.json(rslt);
  } catch (e) {
    next(e);
  }
};

export default listTicketHandlerFactory;

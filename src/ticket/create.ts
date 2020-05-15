import { Request, Response, RequestHandler } from 'express';
import createHttpError from 'http-errors';

import { hasString, decodeBase64 } from '../common';
import { createNewTicket } from './db';

const createTicketHandlerFactory = (db: any): RequestHandler => async (req: Request, res: Response, next): Promise<void> => {
  try {
    hasString(req.body, 'apikey');
    hasString(req.body, 'start_date');
    hasString(req.body, 'end_date');
    hasString(req.body, 'quota');
    const apikey = decodeBase64(req.body.apikey);
    const {
      quota: quotaString,
      start_date: startDateString,
      end_date: endDateString,
    } = req.body;
    let quota: bigint;
    try {
      quota = BigInt(quotaString);
    } catch (e) {
      throw createHttpError(400, "quota must be a string of integer")
    }

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    if (endDate.valueOf() - startDate.valueOf() <= 0) {
      // end date is behind start date
      next(createHttpError(400, 'Malformed request: end_date is behind start_date'));
      return;
    }

    const ticketKey = await createNewTicket(db, apikey, startDate, endDate, quota);
    res.json({ key: ticketKey.toString() });
  } catch (e) {
    next(e);
  }
};

export default createTicketHandlerFactory;

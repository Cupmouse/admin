import { RequestHandler } from 'express';

import { hasString } from '../common';
import { unregisterCustomer } from './db';

const removeCustomerHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'customerKey');

    const customerKey = BigInt(req.body.customerKey);
    
    await unregisterCustomer(db, customerKey)
    res.json({ key: customerKey.toString() });
  } catch (e) {
    next(e);
  }
};

export default removeCustomerHandlerFactory;

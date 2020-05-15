import createHttpError from 'http-errors';
import { RequestHandler } from 'express';

import { hasString, decodeBase64, encodeBase64 } from '../common';
import { searchCustomerAPIKey, searchCustomerEmail } from './db';


const searchCustomerHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'type');
    hasString(req.body, 'query');
  
    const { type, query } = req.body;
    
    if (type === 'apikey') {
      const apikey = decodeBase64(query);
      const result = (await searchCustomerAPIKey(db, apikey)).map((row) => {
        return {
          key: row.key.toString(),
          email: row.email,
          info: encodeBase64(row.apikey),
        };
      });
      res.json(result);
    } else if (type === 'email') {
      const email = query;
      const result = (await searchCustomerEmail(db, email)).map((row) => {
        return {
          key: row.key.toString(),
          email: row.email,
          info: null,
        };
      });
      res.json(result);
    } else {
      next(createHttpError(400, 'Malformed request: Unknown type'));
    }
  } catch (e) {
    next(e);
  }
};

export default searchCustomerHandlerFactory;

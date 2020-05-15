import createHttpError from 'http-errors';
import { RequestHandler } from 'express';

import { hasString } from '../common';
import { registerNewCustomer } from './db';

const registerCustomerHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try{
    hasString(req.body, 'email');
    hasString(req.body, 'password');
  
    const { email, password } = req.body;
  
    if (email === '' || password === '') {
      throw createHttpError(400, 'Some of credentials are empty');
    }
  
    const key = await registerNewCustomer(db, email, password);
    res.json({
      key: key.toString(),
    });
  } catch (e) {
    next(e);
  }
};

export default registerCustomerHandlerFactory;

import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';

import { hasString } from '../common';
import createHttpError from 'http-errors';
import { ADMIN_USER, ADMIN_PASSWORD } from '../constants';
import { getCustomerCredential } from '../customer/db';

const loginHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'email');
    hasString(req.body, 'password');
  
    const email = req.body.email;
    const password = req.body.password;

    if (email === ADMIN_USER) {
      if (password === ADMIN_PASSWORD) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        req.session!.email = email;
        res.json({
          customerKey: '-1',
        });
        return;
      }
    }
  
    const credentials = await getCustomerCredential(db, email);
    if (credentials === null) {
      throw createHttpError(400, 'email or password is incorrect');
    }
  
    const storedPassword = credentials.password;
    const customerKey = credentials.key.toString();
    const ok = await bcrypt.compare(password, storedPassword);
    if (ok) {
      // do login
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      req.session!.email = email;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      req.session!.customerKey = customerKey;
      res.json({
        customerKey: customerKey,
      });
    } else {
      // password missmatch, reject
      throw createHttpError(400, 'email or password is incorrect');
    }
  } catch (e) {
    next(e);
  }
};

export default loginHandlerFactory;

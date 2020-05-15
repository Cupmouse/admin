import { Router } from 'express';
import Stripe from 'stripe';

import prepareCustomerHandlerFactory from './prepare';
import searchCustomerHandlerFactory from './search';
import registerCustomerHandlerFactory from './register';
import removeCustomerHandlerFactory from './remove';
import { checkAdmin, checkSession } from '../auth/handlers';

const customerRouterFactory = (db: any, stripe: Stripe): Router => {
  const router = Router();

  const prepareHandler = prepareCustomerHandlerFactory(db, stripe);
  const searchHandler = searchCustomerHandlerFactory(db);
  const registerHandler = registerCustomerHandlerFactory(db);
  const removeHandler = removeCustomerHandlerFactory(db);

  router.post('/prepare', prepareHandler);
  router.post('/search', checkSession, checkAdmin, searchHandler);
  router.post('/register', checkSession, checkAdmin, registerHandler);
  router.post('/remove', checkSession, checkAdmin, removeHandler);

  return router;
};

export default customerRouterFactory;

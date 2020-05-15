import { Router } from 'express';
import Stripe from 'stripe';

import createTicketHandlerFactory from './create';
import listTicketHandlerFactory from './list';
import removeTicketHandlerFactory from './remove';
import prepareTicketHandlerFactory from './prepare';
import { checkAdmin } from '../auth/handlers';

const ticketRouterFactory = (db: any, stripeClient: Stripe): Router => {
  const router = Router();

  const createHandler = createTicketHandlerFactory(db);
  const listHander = listTicketHandlerFactory(db);
  const removeHandler = removeTicketHandlerFactory(db);
  const prepareHandler = prepareTicketHandlerFactory(db, stripeClient);

  router.post('/create', checkAdmin, createHandler);
  router.post('/list', listHander);
  router.post('/remove', removeHandler);
  router.post('/prepare', prepareHandler);

  return router;
};

export default ticketRouterFactory;

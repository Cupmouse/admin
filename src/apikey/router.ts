import { Router } from 'express';

import listAPIKeyHandlerFactory from './list';
import createAPIKeyHandlerFactory from './create';
import removeAPIKeyHandlerFactory from './remove';
import setEnabledAPIKeyHandlerFactory from './set_enabled';

const apikeyRouterFactory = (db: any): Router => {
  const router = Router();

  const listHandler = listAPIKeyHandlerFactory(db);
  const createHandler = createAPIKeyHandlerFactory(db);
  const removeHandler = removeAPIKeyHandlerFactory(db);
  const setEnabledHandler = setEnabledAPIKeyHandlerFactory(db);

  router.post('/list', listHandler);
  router.post('/create', createHandler);
  router.post('/remove', removeHandler);
  router.post('/enabled', setEnabledHandler);

  return router;
};

export default apikeyRouterFactory;

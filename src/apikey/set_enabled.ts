import { RequestHandler } from 'express';

import { hasString, encodeBase64, decodeBase64 } from '../common';
import createHttpError from 'http-errors';
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from '../constants';
import { getAPIKeyCustomerKey, setAPIKeyEnabled } from './db';

const setEnabledAPIKeyHandlerFactory = (db: any): RequestHandler => async (req, res, next): Promise<void> => {
  try {
    hasString(req.body, 'enabled')
    hasString(req.body, 'apikey');
  
    if (req.body.enabled !== 'true' && req.body.enabled !== 'false') {
      // provided parameter looks like was not intended to be boolean
      throw createHttpError(400, 'Malformed request: Parameter "enabled" must be of boolean value');
    }
    const enabled = req.body.enabled === 'true';
    const apikey = decodeBase64(req.body.apikey);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (req.session!.email! !== ADMIN_USER) {
      const customerKey = await getAPIKeyCustomerKey(db, apikey);
      if (customerKey === null) {
        throw createHttpError(400, `API-Key '${encodeBase64(apikey)}' does not exist`);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (BigInt(req.session!.customerKey) !== customerKey) {
        throw createHttpError(403, ERR_DONT_HAVE_PERMISSION);
      }
    }

    await setAPIKeyEnabled(db, apikey, enabled);

    res.json({
      enabled,
      key: encodeBase64(apikey),
    });
  } catch (e) {
    next(e);
  }
};

export default setEnabledAPIKeyHandlerFactory;

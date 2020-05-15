import createHttpError from "http-errors";
import { randomBytes } from "../common";

type RowGetAPIKeyCustomerKey = {
  customer_key: string;
};

type RowListAPIKeys = {
  key: Buffer;
  enabled: number;
}

export const getAPIKeyCustomerKey = async (db: any, apikey: Buffer): Promise<BigInt | null> => {
  const [rows]: [RowGetAPIKeyCustomerKey[]] = await db.query('SELECT get_apikey_customer_key(?) AS customer_key', [apikey])
  if (rows.length !== 1) {
    throw createHttpError(400, `could not find apikey ${apikey}`);
  }
  if (rows[0].customer_key === null) {
    // there is no such api-key
    return null;
  }
  return BigInt(rows[0].customer_key);
}

export const createNewAPIKey = async (db: any, customerKey: bigint): Promise<Buffer> => {
  const rndBytes = await randomBytes(32);
  const [{affectedRows}]: [{affectedRows: number}] = await db.execute('CALL create_new_apikey(?, ?, 1)', [rndBytes, customerKey]);
  if (affectedRows !== 1) {
    throw createHttpError(500, "failed to create new apikey");
  }
  return rndBytes;
}

export const removeAPIKey = async (db: any, apikey: Buffer): Promise<void> => {
  const [{affectedRows}]: [{affectedRows: number}] =  await db.execute('CALL remove_apikey(?)', [apikey]);
  if (affectedRows !== 1) {
    throw createHttpError(400, `Could not find apikey ${apikey}`);
  }
}

export const listAPIKeys = async (db: any, customerKey: bigint): Promise<RowListAPIKeys[]> => {
  const [[data]]: [[RowListAPIKeys[]]] = await db.execute('CALL list_apikeys(?)', [customerKey]);
  return data;
}

export const setAPIKeyEnabled = async (db: any, apikey: Buffer, enabled: boolean): Promise<void> => {
  const [{rowsAffected}]: [{ rowsAffected: number }] = await db.execute('CALL set_apikey_enabled(?, ?)', [apikey, enabled]);

  if (rowsAffected < 1) {
    throw createHttpError(400, 'Could not find the API-key to set enabled flag');
  }
}

import { randomBytes } from "../common";
import createHttpError from "http-errors";
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from "../constants";

type RowGetCustomerCredential = {
  key: bigint;
  password: string;
};

type RowSearchCustomerAPIKey = {
  key: bigint;
  email: string;
  apikey: Buffer;
}

type RowSearchCustomerEmail = {
  key: bigint;
  email: string;
}

export const getCustomerCredential = async (db: any, email: string): Promise<RowGetCustomerCredential | null> => {
  const [[result]]: [[RowGetCustomerCredential[]]] = await db.query('CALL get_customer_credential(?)', [email]);
  return result.length > 0 ? result[0] : null;
}

export const registerNewCustomer = async (db: any, email: string, password: string): Promise<bigint> => {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const key = (await randomBytes(8)).readBigUInt64LE()
  const [{ affectedRows }]: [{ affectedRows: number }] = await db.query('CALL register_new_customer(?, ?, ?)', [key, email, hashed]);
  if (affectedRows !== 1) {
    throw createHttpError(500, 'Registering new customer failed');
  }
  return key;
}

export const unregisterCustomer = async (db: any, customerKey: bigint): Promise<void> => {
  const [{affectedRows}]: [{affectedRows: number}] = await db.execute('CALL unregister_customer(?)', [customerKey]);
  if (affectedRows !== 1) {
    throw createHttpError(`could not find customer with key = ${customerKey}`);
  }
}

export const searchCustomerAPIKey = async (db: any, apikey: Buffer): Promise<RowSearchCustomerAPIKey[]> => {
  const [[rows]]: [[RowSearchCustomerAPIKey[]]] = await db.query('CALL search_customer_apikey(?)', [apikey]);
  return rows;
}

export const searchCustomerEmail = async (db: any, email: string): Promise<RowSearchCustomerEmail[]> => {
  const [[rows]]: [[RowSearchCustomerEmail[]]] = await db.query('CALL search_customer_email(?)', [email]);
  return rows;
}
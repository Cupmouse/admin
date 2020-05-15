import { randomBytes } from "../common";
import createHttpError from "http-errors";

type RowCreateNewTicket = {
  id: number;
  key: Buffer;
  key_id: number;
  start_date: Date;
  end_date: Date;
  used: bigint;
  quota: bigint;
}

export const createNewTicket = async (db: any, apikey: Buffer, startDate: Date, endDate: Date, quota: bigint): Promise<bigint> => {
  const ticketKey = (await randomBytes(8)).readBigUInt64LE();
  const [results]: [{ affectedRows: number }] = await db.execute('CALL create_new_ticket(?, ?, ?, ?, 0, ?)', [apikey, ticketKey, startDate, endDate, quota])
  if (results.affectedRows !== 1) {
    throw new Error("failed to create a new ticket");
  }
  return ticketKey;
}

export const listAPIKeyTickets = async (db: any, apikey: Buffer): Promise<RowCreateNewTicket[]> => {
  const [[rows]]: [[RowCreateNewTicket[]]] = await db.execute('CALL list_apikey_tickets(?)', [apikey]);
  return rows;
}

export const removeTicket = async (db: any, apikey: Buffer, key: bigint): Promise<void> => {
  const [results]: [{ affectedRows: number }] = await db.execute('CALL remove_ticket(?, ?)', [apikey, key]);
  if (results.affectedRows !== 1) {
    throw createHttpError(400, 'Could not find ticket to remove');
  }
}

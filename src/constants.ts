import config from 'config';

export const SALT_ROUNDS = 13;
export const GB = 2n ** 30n;
export const ADMIN_USER = config.get<string>("adminUser.email");
export const ADMIN_PASSWORD = config.get<string>("adminUser.password");
export const QUOTA_MAX = 10000000n;
export const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

type PriceTable = {
  end: bigint;
  price: bigint;
}[];
const min = (a: bigint, b: bigint): bigint => {
  return a < b ? a : b;
};
const max = (a: bigint, b: bigint): bigint => {
  return a > b ? a : b;
};
const loadPriceTable = (): PriceTable => {
  const orig: {
    end: number;
    price: number;
  }[] = config.get("priceTable");

  const table: PriceTable = [];
  for (let i = 0; i < orig.length; i++) {
    table[i].end = BigInt(orig[i].end);
    table[i].price = BigInt(orig[i].price);
  }

  return table;
};

export const calcPrice = (quota: bigint): bigint => {
  const priceTable = loadPriceTable();
  let price = 0n;
  price += min(quota, priceTable[0].end) * priceTable[0].price;
  quota = max(quota - priceTable[0].end, 0n);
  for (let i = 1; i < priceTable.length; i++) {
    const step = priceTable[i].end - priceTable[i-1].end;
    price += min(quota, step) * priceTable[i].price;
    quota = max(quota - step, 0n);
  }
  return price;
};

export const ERR_NOT_LOGGED_IN = 'you must be logged in to access this resource';
export const ERR_DONT_HAVE_PERMISSION = 'you don\'t have a permission to access this resource';
export const PASSWORD_LENGTH = 32;

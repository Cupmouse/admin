export const CORS_ORIGIN = process.env.NODE_ENV === 'production' ? [
  'https://admin.exchangedataset.cc/',
  'https://console.exchangedataset.cc/',
  'https://www.exchangedataset.cc/'
] : [
  'http://localhost:3003',
  'http://localhost:3001',
  'http://localhost:3000',
];

export const DATABASE_HOST = 'exchangedataset-database.cqdpweplfhn7.us-east-2.rds.amazonaws.com';
export const DATABASE_USER = 'console';
export const DATABASE_PASSWORD = 'JmHwxedjgSTywPVmVF2ahZUg3gH6FUF0';
export const DATABASE_NAME = 'exchangedataset';
export const DATABASE_PORT = 25883;
export const SALT_ROUNDS = 13;
export const GB = 2n ** 30n;
export const COOKIE_SECRET = '4yEKudNCIqI17OqX1PHsR0xCURJ4U6ux';
export const ADMIN_USER = 'admin';
export const ADMIN_PASSWORD = 'ymYnvvJ9xZvJD8EmVMjvY6Ri0waYtACN';
export const STRIPE_SECRET = process.env.NODE_ENV === 'production' ? 'sk_live_auukHKXmdrh0CFGoWGTPa03t00f6PCVpsX' : 'sk_test_xd8VeKvIB6UPXLNghXAyI1cK0096Fo6qga';
export const STRIPE_WEBHOOK_SECRET = process.env.NODE_ENV === 'production' ? 'whsec_WlJ3lIv3grLCq4MQ6WFFIA5LUohokahM' : 'whsec_DGswWLKtyBHc6L12tUR8Cpaw1SQQ8Fxp';
export const QUOTA_MAX = 10000000n;
export const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// stripe uses cent as a minimum currency size
export const PRICING_TABLE = [
  {
    end: 1n,
    price: 1000n,
  },
  {
    end: 30n,
    price: 100n,
  },
  {
    end: 200n,
    price: 40n,
  },
  {
    end: 1000n,
    price: 35n,
  },
  {
    // FIXME CHANGE THIS IF YOU CHANGED QUOTA_MAX
    end: QUOTA_MAX*1000000000000n,
    price: 25n,
  },
]
const min = (a: bigint, b: bigint): bigint => {
  return a < b ? a : b;
};
const max = (a: bigint, b: bigint): bigint => {
  return a > b ? a : b;
};
export const calcPrice = (quota: bigint): bigint => {
  let price = 0n;
  price += min(quota, PRICING_TABLE[0].end) * PRICING_TABLE[0].price;
  quota = max(quota - PRICING_TABLE[0].end, 0n);
  for (let i = 1; i < PRICING_TABLE.length; i++) {
    const step = PRICING_TABLE[i].end - PRICING_TABLE[i-1].end;
    price += min(quota, step) * PRICING_TABLE[i].price;
    quota = max(quota - step, 0n);
  }
  return price;
}

export const ERR_NOT_LOGGED_IN = 'you must be logged in to access this resource';
export const ERR_DONT_HAVE_PERMISSION = 'you don\'t have a permission to access this resource';
export const PASSWORD_LENGTH = 32;

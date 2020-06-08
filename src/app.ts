#!/usr/bin/env node

import http from 'http';
import createError from 'http-errors';
import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import session, { MemoryStore } from 'express-session';
import helmet from 'helmet';
import Stripe from "stripe";
import nodemailer from 'nodemailer';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import redis from 'redis';
import connectRedis from 'connect-redis';
import config from 'config';
const mysql2 = require('mysql2/promise');

import loginHandlerFactory from './auth/login';
import customerRouterFactory from './customer/router';
import apikeyRouterFactory from './apikey/router';
import ticketRouterFactory from './ticket/router';
import webhookEndpointFactory from './webhook';
import { checkSession } from './auth/handlers';
// constant value would change according to the environment (dev or prod)
import  { ERR_DONT_HAVE_PERMISSION } from  './constants';

const app = express();
app.use(helmet());
app.use(cors({
  origin: config.get<string[]>("corsOrigins"),
  credentials: true,
}));
let store;
if (process.env.NODE_ENV === 'production') {
  const RedisStore = connectRedis(session);
  const redisCli = redis.createClient();
  store = new RedisStore({ client: redisCli });
} else {
  store = new MemoryStore();
}
app.use(session({
  store,
  secret: config.get<string>("cookieSecret"),
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1800000,
    path: '/',
  }
}))
app.use(morgan('dev'));

// initialize database connection pool
const db = mysql2.createPool({
  host: config.get<string>("database.host"),
  user: config.get<string>("database.user"),
  password: config.get<string>("database.password"),
  database: config.get<string>("database.database"),
  port: config.get<number>("database.port"),
  ssl: 'Amazon RDS',
  supportBigNumbers: true,
  timezone: 'Z',
});

// create new stripe client
const stripeClient = new Stripe(config.get<string>("stripe.secret"), {
  apiVersion: '2020-03-02',
});

const mailTransport = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  secure: true,
  auth: {
    user: 'AKIA4NFVPVH64H3EUJEQ',
    pass: 'BMLNt/TVdtDCWoC4M4gHJSsaMsKions2p0RmX4/KGfTX',
  },
});

const loginHander = loginHandlerFactory(db);

// setup routers and attach it to the root
const customerRouter = customerRouterFactory(db, stripeClient);
const apikeyRouter = apikeyRouterFactory(db);
const ticketRouter = ticketRouterFactory(db, stripeClient);
const webhookHandler = webhookEndpointFactory(db, stripeClient, mailTransport);

app.post('/login', express.json(), loginHander);
app.use('/customer', express.json(), customerRouter);
app.use('/apikey', express.json(), checkSession, apikeyRouter);
app.use('/ticket', express.json(), checkSession, ticketRouter);
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), webhookHandler);

app.use((req, res, next) => {
  next(createError(403, ERR_DONT_HAVE_PERMISSION));
});

app.use((err: Error, req: Request, res: Response, next: RequestHandler) => {
  if (err instanceof createError.HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
  } else {
    console.error(err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// listen server

const server = http.createServer(app);
let port = 3000;
if (typeof process.env.PORT !== 'undefined') {
  port = parseInt(process.env.PORT);
}
server.listen(port);
server.on('error', console.log);
server.on('listening', () => console.log('listening'));

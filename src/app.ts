#!/usr/bin/env node

import http from 'http';
import createError from 'http-errors';
import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import session from 'express-session';
import helmet from 'helmet';
import Stripe from "stripe";
import nodemailer from 'nodemailer';
import morgan from 'morgan';
import bodyParser from 'body-parser';
const mysql2 = require('mysql2/promise');

import loginHandlerFactory from './auth/login';
import customerRouterFactory from './customer/router';
import apikeyRouterFactory from './apikey/router';
import ticketRouterFactory from './ticket/router';
import webhookEndpointFactory from './webhook';
import { checkSession } from './auth/handlers';
// constant value would change according to the environment (dev or prod)
import  {
  CORS_ORIGIN,
  DATABASE_HOST,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_PORT,
  COOKIE_SECRET,
  STRIPE_SECRET,
  ERR_DONT_HAVE_PERMISSION,
} from  './constants';

const app = express();
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(session({
  secret: COOKIE_SECRET,
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
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  port: DATABASE_PORT,
  ssl: 'Amazon RDS',
  supportBigNumbers: true,
  timezone: 'Z',
});

// create new stripe client
const stripeClient = new Stripe(STRIPE_SECRET, {
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

const server = http.createServer(app).listen(3000);
server.on('error', console.log);
server.on('listening', () => console.log('listening'));

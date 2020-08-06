import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import 'express-async-errors'; // Fix Express async bug

import { currentuserRouter } from './routes/currentuser';
import { signupRouter } from './routes/signup';

import { errorHandler, NotFoundError } from '@agreejwc/common';

const app = express();

app.set('trust proxy', true);

app.use(bodyParser.json());

app.use(
  cookieSession({
    name: 'myStoreCookie',
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
    maxAge: parseInt(
      process.env.COOKIE_MAX_AGE === undefined
        ? '2592000000'
        : process.env.COOKIE_MAX_AGE!
    ),
  })
);

// Router
app.use(currentuserRouter);
app.use(signupRouter);
// app.use(signinRouter);
// app.use(signoutRouter);

// Router for invalid path
app.all('*', async (req, res) => {
  throw new NotFoundError('Route not found');
});

// Error Handler
app.use(errorHandler);

export { app };

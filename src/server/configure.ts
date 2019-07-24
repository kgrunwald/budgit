import express from 'express';
import bodyParser from 'body-parser';
import plaid from './plaid';

export default (app: express.Application) => {
  app.use(bodyParser.json());
  app.use(plaid);
};

import express from 'express';
import bodyParser from 'body-parser';
import api from './api';

export default (app: express.Application) => {
  app.use(bodyParser.json());
  app.use('/api', api);
};

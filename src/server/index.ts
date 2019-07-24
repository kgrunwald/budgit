import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import bodyParser from 'body-parser';
import { resolve, join } from 'path';

dotenv.config({ path: resolve(__dirname, '../../', '.env')});
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: resolve(__dirname, '../../', '.env.local')});
}

import initializeParseClient from './parse';
initializeParseClient();

import logger from './logger';
import plaid from './plaid';

// tslint:disable-next-line
const ParseServer = require('parse-server').ParseServer;

const { PORT = 3000 } = process.env;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}/parse`;

const app = express();

app.use(bodyParser.json());
app.use((req, res, next) => {
    logger.info(`Request on path: ${req.path}`);
    next();
});

const parse = new ParseServer({
    databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
    appId: process.env.PARSE_APP_ID || 'testAppId',
    masterKey: process.env.MASTER_KEY || 'myMasterKey',
    liveQuery: {
        classNames: ['Item'], // List of classes to support for query subscriptions
    },
    serverURL: SERVER_URL,
});
app.use('/parse', parse);
app.use(plaid);

const publicPath = resolve(__dirname, '../');
const staticConf = { maxAge: '1y', etag: false };

app.use(express.static(publicPath, staticConf));
app.get('*', (req, res) => {
    res.sendFile(join(__dirname + '/../index.html'));
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    logger.info(`StaticServer running on ${SERVER_URL.replace('/parse', '/')}`);
});

ParseServer.createLiveQueryServer(httpServer);

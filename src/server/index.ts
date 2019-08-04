import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { resolve, join } from 'path';

dotenv.config({ path: resolve(__dirname, '../../', '.env')});
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: resolve(__dirname, '../../', '.env.local')});
}

import initializeParseClient from './parse';

// tslint:disable-next-line

const { PORT = 3000, APP_ID = 'jk-budgit', MASTER_KEY = 'myMasterKey' } = process.env;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}/parse`;
const STATIC_PATH = process.env.STATIC_PATH || '/../..';
initializeParseClient(APP_ID, MASTER_KEY, SERVER_URL);

import logger from './logger';
import plaid from './plaid';
const app = express();

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

const ParseServer = require('parse-server').ParseServer;
const parse = new ParseServer({
    databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
    appId: APP_ID,
    masterKey: MASTER_KEY,
    liveQuery: {
        classNames: ['Item', 'Account', 'Transaction'],
    },
    serverURL: SERVER_URL,
    sessionLength: 60 * 60,
});

app.use('/parse', parse);
app.use(plaid);

const publicPath = resolve(__dirname, STATIC_PATH);
const staticConf = { maxAge: '1y', etag: false };

app.use(express.static(publicPath, staticConf));
app.get('*', (req, res) => {
    res.sendFile(join(__dirname + STATIC_PATH + '/public/index.html'));
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    logger.info(`StaticServer running on ${SERVER_URL.replace('/parse', '/')}`);
});

ParseServer.createLiveQueryServer(httpServer);

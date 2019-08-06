import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { resolve } from 'path';

const { NODE_ENV = 'local' } = process.env;
let dotenvPath = '../../';
if (NODE_ENV === 'production') {
    dotenvPath = '../../../';
}

console.log(resolve(__dirname, dotenvPath, '.env'));
dotenv.config({ path: resolve(__dirname, dotenvPath, '.env')});
if (NODE_ENV !== 'production') {
    console.log('Loading local env');
    dotenv.config({ path: resolve(__dirname, dotenvPath, '.env.local')});
}

const { 
    PORT = 3000, 
    APP_ID = 'jk-budgit',
    MASTER_KEY = 'myMasterKey',
    SERVER_URL = `http://localhost:${PORT}/parse`,
    STATIC_PATH = '/../../public',
    MONGODB_URI = 'mongodb://localhost:27017/dev',
    CLOUD_CODE = './src/server/cloud/main.ts',
} = process.env;

import initializeParseClient from './parse';

initializeParseClient(APP_ID, MASTER_KEY, SERVER_URL);

import logger from './logger';
import plaid from './plaid';
const app = express();

logger.info('Config', {
    PORT, APP_ID, SERVER_URL, STATIC_PATH, CLOUD_CODE
})

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

const ParseServer = require('parse-server').ParseServer;
const parse = new ParseServer({
    databaseURI: MONGODB_URI,
    cloud: CLOUD_CODE,
    appId: APP_ID,
    masterKey: MASTER_KEY,
    liveQuery: {
        classNames: ['Item', 'Account', 'Transaction', 'CategoryGroup', 'Category'],
    },
    serverURL: SERVER_URL,
    sessionLength: 60 * 60,
});

app.use('/parse', parse);
app.use('/api', plaid);

const publicPath = resolve(__dirname, STATIC_PATH);
const staticConf = { maxAge: '1y', etag: false };

app.use(express.static(publicPath, staticConf));
app.get('*', (req, res) => {
    res.sendFile(resolve(__dirname, STATIC_PATH + '/index.html'));
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    logger.info(`StaticServer running on ${SERVER_URL.replace('/parse', '/')}`);
});

ParseServer.createLiveQueryServer(httpServer);

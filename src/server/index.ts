import express from 'express';
import winston from 'winston';
import http from 'http';
import { resolve, join } from 'path';
import configureAPI from './configure';

// tslint:disable-next-line
const ParseServer = require('parse-server').ParseServer;

const { PORT = 3000} = process.env;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}/parse`;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    ],
});

const app = express();

app.use((req, res, next) => {
    logger.info(`Request on path: ${req.path}`);
    next();
});

const parse = new ParseServer({
    databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
    appId: 'jk-budgit',
    masterKey: process.env.MASTER_KEY || 'myMasterKey',
    liveQuery: {
        classNames: ['Item'], // List of classes to support for query subscriptions
    },
});
app.use('/parse', parse);

configureAPI(app);

const publicPath = resolve(__dirname, '../');
const staticConf = { maxAge: '1y', etag: false };

app.use(express.static(publicPath, staticConf));
// app.use('/', history())

app.get('*', (req, res) => {
    res.sendFile(join(__dirname + '/../index.html'));
});

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    logger.info(`StaticServer running on ${SERVER_URL.replace('/parse', '/')}`);
});

ParseServer.createLiveQueryServer(httpServer);

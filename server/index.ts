import express from 'express';
import winston from 'winston';
import { resolve, join } from 'path';
import configureAPI from './configure';

const { PORT = 3000} = process.env;
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
})

configureAPI(app)

const publicPath = resolve(__dirname, '../')
const staticConf = { maxAge: '1y', etag: false }

app.use(express.static(publicPath, staticConf))
// app.use('/', history())

app.get('*', (req, res) => {
    res.sendFile(join(__dirname + '/../index.html'));
});

app.listen(PORT, () => logger.info(`App running on port ${PORT}!`))

import express from 'express';
import winston from 'winston';
import * as path from 'path';

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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../index.html'));
});

app.listen(PORT);

logger.info(`Listening on port ${PORT}`);

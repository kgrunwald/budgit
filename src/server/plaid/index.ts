import plaid from 'plaid';
import { Router, Request, Response } from 'express';
import logger from '../logger';
import Item from '../../models/Item';

const CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY || '';

const client = new plaid.Client(
    CLIENT_ID,
    PLAID_SECRET,
    PUBLIC_KEY,    
    plaid.environments.sandbox,
    {version: '2019-05-29'},
);

const plaidRouter = Router();

plaidRouter.post('/get_access_token', async (req: Request, res: Response) => {
    try {
        logger.info('Got request for access token');
        const tokenResponse = await client.exchangePublicToken(req.body.public_token);
        const item = new Item();
        item.accessToken = tokenResponse.access_token;
        item.itemId = tokenResponse.item_id;
        await item.save();

        logger.info('Got access token', item);
        let trans = await client.getAllTransactions(item.accessToken, "2019-07-20", '2019-07-23')
        logger.info(JSON.stringify(trans.transactions));
        res.json({'error': false});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default plaidRouter;

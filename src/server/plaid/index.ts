import plaid from 'plaid';
import { Router, Request, Response } from 'express';

let ACCESS_TOKEN = null;
let ITEM_ID = null;

const client = new plaid.Client(
    process.env.PLAID_CLIENT_ID || '',
    process.env.PLAID_SECRET || '',
    process.env.PUBLIC_KEY || '',
    plaid.environments.sandbox,
    {version: '2019-05-29'},
);

const plaidRouter = Router();

plaidRouter.post('/get_access_token', async (req: Request, res: Response) => {
    try {
        console.log(req.body.public_token)
        const tokenResponse = await client.exchangePublicToken(req.body.public_token);
        ACCESS_TOKEN = tokenResponse.access_token;
        ITEM_ID = tokenResponse.item_id;
        console.log('Access Token: ' + ACCESS_TOKEN);
        console.log('Item ID: ' + ITEM_ID);
        res.json({'error': false});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default plaidRouter;

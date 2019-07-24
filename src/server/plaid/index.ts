import plaid from 'plaid';

const client = new plaid.Client(
    process.env.PLAID_CLIENT_ID,
    process.env.PLAID_SECRET,
    process.env.PUBLIC_KEY,
    plaid.environments.sandbox,
    {version: '2019-05-29'},
);

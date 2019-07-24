import Parse from 'parse/node';

export default () => {
    const APP_ID = process.env.PARSE_APP_ID || '';
    const MASTER_KEY = process.env.MASTER_KEY || '';
    Parse.initialize(APP_ID, "", MASTER_KEY);
    Parse.serverURL = 'http://localhost:3000/parse';
};
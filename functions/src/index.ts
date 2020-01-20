import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

import { transactionTrigger } from './triggers';
import {
    webhook,
    getAccessToken,
    refreshToken,
    updateAccounts,
    removeAccount
} from './plaid';

exports.transactionTrigger = functions.firestore
    .document('Users/{userId}/Transactions/{txnId}')
    .onUpdate(transactionTrigger);
exports.webhook = functions.https.onRequest(webhook);
exports.getAccessToken = functions.https.onRequest(getAccessToken);
exports.refreshToken = functions.https.onRequest(refreshToken);
exports.updateAccounts = functions.https.onRequest(updateAccounts);
exports.removeAccount = functions.https.onRequest(removeAccount);

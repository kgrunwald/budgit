import * as functions from 'firebase-functions';

import {
    webhook,
    webhookHandler,
    getAccessToken,
    refreshToken,
    updateAccounts,
    removeAccount
} from './plaid';

const topic = functions.config().pubsub.topic;

exports.webhookHandler = functions.pubsub
    .topic(topic)
    .onPublish(webhookHandler);
exports.webhook = functions.https.onRequest(webhook);
exports.getAccessToken = functions.https.onCall(getAccessToken);
exports.refreshToken = functions.https.onCall(refreshToken);
exports.updateAccounts = functions.https.onCall(updateAccounts);
exports.removeAccount = functions.https.onCall(removeAccount);

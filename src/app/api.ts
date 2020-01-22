import firebase from 'firebase/app';
import 'firebase/functions';

let updateAccountsFunc: firebase.functions.HttpsCallable;
let getAccessTokenFunc: firebase.functions.HttpsCallable;
let refreshTokenFunc: firebase.functions.HttpsCallable;
let removeAccountFunc: firebase.functions.HttpsCallable;

export const initializeApi = (app: firebase.app.App) => {
    updateAccountsFunc = app.functions().httpsCallable('updateAccounts');
    getAccessTokenFunc = app.functions().httpsCallable('getAccessToken');
    refreshTokenFunc = app.functions().httpsCallable('refreshToken');
    removeAccountFunc = app.functions().httpsCallable('removeAccount');
};

export const updateAccounts = (itemId: string) =>
    updateAccountsFunc({ itemId });

export const getAccessToken = (publicToken: string) =>
    getAccessTokenFunc({ publicToken });

export const refreshToken = (itemId: string) => refreshTokenFunc({ itemId });

export const removeAccount = (accountId: string) =>
    removeAccountFunc({ accountId });

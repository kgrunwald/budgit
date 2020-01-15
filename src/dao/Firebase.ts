import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

let db: firebase.firestore.Firestore;

// if (typeof window === 'undefined') {
//   // tslint:disable
//   const admin = require('firebase-admin');
//   const functions = require('firebase-functions');
//   admin.initializeApp(functions.config().firebase);
//   // tslint:enable
//   db = admin.firestore();
// } else {
firebase.initializeApp({
    apiKey: 'AIzaSyDsRwythALU0vhd8J6u96gjH-18agODJgs',
    authDomain: 'jk-budgit.firebaseapp.com',
    databaseURL: 'https://jk-budgit.firebaseio.com',
    projectId: 'jk-budgit',
    appId: 'budgit-web'
});
db = firebase.firestore();
// }

export default db;

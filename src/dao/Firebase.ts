import firebase from 'firebase/app';
import 'firebase/firestore';

let firestore!: firebase.firestore.Firestore;

export function initializeFirestore(app: firebase.app.App) {
    firestore = app.firestore();
}

export default function db() {
    return firestore;
}

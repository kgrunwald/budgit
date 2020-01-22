import * as firebase from 'firebase/app';
import { EventEmitter } from 'events';
import 'firebase/firestore';
import Model from '../models/Model';
import { classToObject, objectToClass } from '../models/Metadata';
import { Dao, Subscriber, Where, Order } from './Dao';

let firestore!: firebase.firestore.Firestore;

interface FirestoreApp {
    firestore(): firebase.firestore.Firestore;
}

export function initializeFirestore(app: FirestoreApp) {
    firestore = app.firestore();
}

export function db() {
    return firestore;
}

export default class FirebaseDao<T extends Model> extends EventEmitter
    implements Dao<T> {
    private collectionName!: string;

    constructor(private clazz: new () => T) {
        super();
    }

    public async commit(obj: T): Promise<T> {
        if (obj.id) {
            return this.update(obj);
        }

        return this.create(obj);
    }

    public async all(): Promise<T[]> {
        const docs = await this.collection().get();
        return this.docsToClassArray(docs);
    }

    public subscribe(s: Subscriber<T>): void {
        this.collection().onSnapshot(
            (snapshot: firebase.firestore.QuerySnapshot) => {
                snapshot
                    .docChanges()
                    .forEach((change: firebase.firestore.DocumentChange) => {
                        const x: T = this.docToClass(change.doc);
                        switch (change.type) {
                            case 'added':
                            case 'modified':
                                s.add(x);
                                break;
                            case 'removed':
                                s.remove(x);
                        }
                    });
            }
        );
    }

    public async delete(obj: T): Promise<void> {
        await this.collection()
            .doc(obj.id)
            .delete();
    }

    public async get(id: string): Promise<T | undefined> {
        const doc = await this.collection()
            .doc(id)
            .get();

        if (!doc.exists) {
            return;
        }

        return this.docToClass(doc);
    }

    public async getOrCreate(field: string, id: string): Promise<T> {
        try {
            const obj = await this.first(field, id);
            if (obj) {
                return obj;
            }
        } catch (err) {
            // pass;
        }

        const newObj = new this.clazz();
        return newObj;
    }

    public async find(key: string, value: any): Promise<T[]> {
        const docs = await this.collection()
            .where(key, '==', value)
            .get();

        return this.docsToClassArray(docs);
    }

    public async first(key: string, value: any): Promise<T | undefined> {
        const res = await this.collection()
            .where(key, '==', value)
            .limit(1)
            .get();

        if (res.empty) {
            return;
        }

        return this.docsToClassArray(res)[0];
    }

    public async query(
        wheres: Where[],
        order?: Order,
        limit?: number
    ): Promise<T[]> {
        let q = this.collection() as firebase.firestore.Query;
        for (const where of wheres) {
            q = q.where(where.key, where.operator, where.value);
        }

        if (order) {
            q.orderBy(order.field, order.order);
        }

        if (limit) {
            q.limit(limit);
        }

        const res = await q.get();
        return this.docsToClassArray(res);
    }

    public setCollectionName(name: string): void {
        this.collectionName = name;
    }

    protected async update(obj: T): Promise<T> {
        await this.collection()
            .doc(obj.id)
            .set(classToObject(obj));
        return obj;
    }

    protected async create(obj: T): Promise<T> {
        const res = await this.collection().add(classToObject(obj));
        const doc = await res.get();
        return this.docToClass(doc);
    }

    protected collection(): firebase.firestore.CollectionReference {
        return db().collection(this.collectionName);
    }

    protected docsToClassArray(
        snapshot: firebase.firestore.QuerySnapshot
    ): T[] {
        return snapshot.docs.map(doc => this.docToClass(doc));
    }

    private docToClass(doc: firebase.firestore.DocumentData): T {
        const data = doc.data();
        if (data) {
            return objectToClass(this.clazz, { ...data, id: doc.id });
        }

        throw new Error('Could not find document');
    }
}

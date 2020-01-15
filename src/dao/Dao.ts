import db from './Firebase';
import 'reflect-metadata';
import Model from '../models/Model';
import { classToObject, objectToClass } from '../models/Metadata';

export interface Subscriber<T extends Model> {
    add(obj: T): void;
    remove(obj: T): void;
}

abstract class Dao<T extends Model> {
    constructor(protected clazz: new () => T) {}

    public async commit(obj: T): Promise<T> {
        if (obj.id) {
            return this.update(obj);
        }

        return this.create(obj);
    }

    public async all() {
        const docs = await db.collection(this.clazz.name).get();
        return this.docsToClassArray(docs);
    }

    public subscribe(s: Subscriber<T>) {
        this.collection().onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
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
        });
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

    protected async get(id: string): Promise<T | undefined> {
        const doc = await this.collection()
            .doc(id)
            .get();

        if (!doc.exists) {
            return;
        }

        return this.docToClass(doc);
    }

    protected async getOrCreate(field: string, id: string) {
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

    protected async find(key: string, value: any): Promise<T[]> {
        const docs = await this.collection()
            .where(key, '==', value)
            .get();

        return this.docsToClassArray(docs);
    }

    protected async first(key: string, value: any): Promise<T | undefined> {
        const res = await this.collection()
            .where(key, '==', value)
            .limit(1)
            .get();

        if (res.empty) {
            return;
        }

        return this.docsToClassArray(res)[0];
    }

    protected collection(): firebase.firestore.CollectionReference<
        firebase.firestore.DocumentData
    > {
        return db.collection(this.clazz.name);
    }

    protected docsToClassArray(
        snapshot: firebase.firestore.QuerySnapshot<
            firebase.firestore.DocumentData
        >
    ): T[] {
        return snapshot.docs.map(this.docToClass);
    }

    private docToClass(doc: firebase.firestore.DocumentData): T {
        const data = doc.data();
        if (data) {
            return objectToClass(this.clazz, { ...data, id: doc.id });
        }

        throw new Error('Could not find document');
    }
}

export default Dao;

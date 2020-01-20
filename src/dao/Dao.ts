import 'reflect-metadata';
import Model from '../models/Model';

export interface Subscriber<T extends Model> {
    add(obj: T): void;
    remove(obj: T): void;
}

export interface Where {
    key: string;
    operator: '==' | '>=' | '>' | '<' | '<=';
    value: any;
}

export interface Order {
    field: string;
    order: 'asc' | 'desc';
}

export interface Dao<T extends Model> {
    commit(obj: T): Promise<T>;
    all(): Promise<T[]>;
    subscribe(s: Subscriber<T>): void;
    delete(obj: T): Promise<void>;
    get(id: string): Promise<T | undefined>;
    getOrCreate(field: string, id: string): Promise<T>;
    first(key: string, value: any): Promise<T | undefined>;
    find(key: string, value: any): Promise<T[]>;
    query(wheres: Where[], order?: Order, limit?: number): Promise<T[]>;
    setCollectionName(name: string): void;
}

export class DaoBase<T extends Model> {
    constructor(protected dao: Dao<T>, private className: string) {}

    public subscribe(s: Subscriber<T>): void {
        this.dao.subscribe(s);
    }

    public commit(t: T): Promise<T> {
        return this.dao.commit(t);
    }

    public all(): Promise<T[]> {
        return this.dao.all();
    }

    public async delete(t: T): Promise<void> {
        return this.dao.delete(t);
    }

    public async byId(id: string): Promise<T> {
        const t = await this.dao.get(id);
        if (!t) {
            throw new Error(
                'Could not find ' + this.className + ' byId: ' + id
            );
        }
        return t;
    }
}

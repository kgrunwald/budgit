import Model from './Model';
import { field } from './Metadata';

export default class Item implements Model {
    @field public id!: string;
    @field public accessToken!: string;
    @field public itemId!: string;
    @field public userId!: string;

    private _date: Date = new Date();
    private _lastUpdate!: Date;

    @field
    get createdDate(): Date {
        return this._date;
    }

    set createdDate(date: Date) {
        if (this.isTimestamp(date)) {
            this._date = date.toDate();
        } else {
            this._date = date || new Date();
        }
    }

    @field
    get lastUpdateTime(): Date {
        return this._lastUpdate;
    }

    set lastUpdateTime(date: Date) {
        if (this.isTimestamp(date)) {
            this._lastUpdate = date.toDate();
        } else {
            this._lastUpdate = date || new Date();
        }
    }

    private isTimestamp(date: any): date is firebase.firestore.Timestamp {
        if (date && typeof date.toDate == 'function') {
            return true;
        }
        return false;
    }
}

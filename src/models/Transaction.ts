import Model from './Model';
import { field } from './Metadata';
import { formatMoney, moneyAsFloat } from './Money';

export default class Transaction implements Model {
    @field public id!: string;
    @field public transactionId!: string;
    @field public merchant!: string;
    @field public amount!: number;
    @field public currency!: string;
    @field public categoryId?: string;
    @field public accountId!: string;
    @field public acknowledged: boolean = false;

    public categoryName?: string;

    private _date!: Date;

    get formattedAmount(): string {
        return formatMoney(moneyAsFloat(this.amount));
    }

    get formattedDate(): string {
        return this.date.toISOString().split('T')[0];
    }

    @field
    get date(): Date {
        return this._date;
    }

    set date(date: Date) {
        if (this.isTimestamp(date)) {
            this._date = date.toDate();
        } else {
            this._date = date;
        }
    }

    private isTimestamp(date: any): date is firebase.firestore.Timestamp {
        if (typeof date.toDate == 'function') {
            return true;
        }
        return false;
    }
}

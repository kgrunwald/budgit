import Model from './Model';
import { field } from './Metadata';
import { formatMoney, moneyAsFloat } from './Money';

export default class Transaction implements Model {
    @field public id!: string;
    @field public transactionId!: string;
    @field public merchant!: string;
    @field public currency!: string;
    @field public categoryId?: string;
    @field public accountId!: string;
    @field public acknowledged: boolean = false;

    public categoryName?: string;

    private _date!: Date;
    private _amt!: number;

    @field
    get amount(): number {
        return this._amt;
    }

    set amount(amt: number) {
        this._amt = moneyAsFloat(amt);
    }

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

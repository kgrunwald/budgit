import Model from './Model';
import { formatMoney, moneyAsFloat } from './Money';

export default class Transaction extends Model {
    public transactionId!: string;
    public merchant!: string;
    public amount!: number;
    public currency!: string;
    public date!: Date;
    public categoryId?: string;
    public accountId!: string;
    public acknowledged: boolean = false;

    get formattedAmount(): string {
        return formatMoney(moneyAsFloat(this.amount));
    }

    get formattedDate(): string {
        return this.date.toISOString().split('T')[0];
    }
}

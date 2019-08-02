import Parse from './Parse';
import PrivateModel from './PrivateModel';
import Account from './Account';
import formatter from 'currency-formatter';

class Transaction extends PrivateModel {
    constructor() {
        super('Transaction');
    }

    get transactionId(): string {
        return this.get('transactionId');
    }

    set transactionId(id: string) {
        this.set('transactionId', id);
    }

    get merchant(): string {
        return this.get('merchant');
    }

    set merchant(merchant: string) {
        console.log('Set merchant', merchant);
        this.set('merchant', merchant);
    }

    get amount(): number {
        return this.get('amount');
    }

    set amount(amount: number) {
        this.set('amount', amount);
    }

    get formattedAmount(): string {
        return formatter.format(this.amount, { code: this.currency || 'USD' });
    }

    set currency(currency: string) {
        this.set('currency', currency);
    }

    get currency(): string {
        return this.get('currency');
    }

    get date(): string {
        return this.get('date');
    }

    set date(date: string) {
        this.set('date', date);
    }

    get category(): string {
        return this.get('category');
    }

    set category(category: string) {
        this.set('category', category);
    }

    get account(): Account {
        return this.get('account');
    }

    set account(account: Account) {
        this.set('account', account);
    }
}

Parse.Object.registerSubclass('Transaction', Transaction);
export default Transaction;

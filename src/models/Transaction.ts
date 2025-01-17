import Parse from './Parse';
import PrivateModel from './PrivateModel';
import Account from './Account';
import Category from './Category';
import { formatMoney, sanitizeMoney, moneyAsFloat } from './Money';

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
    this.set('merchant', merchant);
  }

  get amount(): number {
    return moneyAsFloat(this.get('amount'));
  }

  set amount(amount: number) {
    this.set('amount', moneyAsFloat(amount));
  }

  get formattedAmount(): string {
    return formatMoney(this.amount);
  }

  set currency(currency: string) {
    this.set('currency', currency);
  }

  get currency(): string {
    return this.get('currency');
  }

  get date(): Date {
    return this.get('date');
  }

  set date(date: Date) {
    this.set('date', date);
  }

  get formattedDate(): string {
    return this.date.toISOString().split('T')[0];
  }

  get category(): Category {
    return this.get('category');
  }

  set category(category: Category) {
    this.set('category', category);
  }

  get categoryName(): string {
    return this.category ? this.category.name : '';
  }

  get account(): Account {
    return this.get('account');
  }

  set account(account: Account) {
    this.set('account', account);
  }

  get acknowledged(): boolean {
    return this.get('acknowledged');
  }

  set acknowledged(ack: boolean) {
    this.set('acknowledged', ack);
  }
}

Parse.Object.registerSubclass('Transaction', Transaction);
export default Transaction;

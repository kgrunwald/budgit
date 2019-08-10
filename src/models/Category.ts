import Parse from './Parse';
import PrivateModel from './PrivateModel';
import formatter from 'currency-formatter';
import CategoryGroup from './CategoryGroup';
import Account from './Account';
import { reduce, has } from 'lodash';
import { format } from 'date-fns';

class Category extends PrivateModel {

    get name(): string {
        if (this.isPayment) {
            return `Payment: ${this.paymentAccount.name}`;
        }
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }

    set group(group: CategoryGroup) {
        this.set('group', group);
    }

    get group(): CategoryGroup {
        return this.get('group');
    }

    set paymentAccount(acct: Account) {
        this.set('paymentAccount', acct);
    }

    get paymentAccount(): Account {
        return this.get('paymentAccount');
    }

    get isPayment(): boolean {
        return !!this.paymentAccount;
    }

    public static getKey(month: Date): string {
        return format(month, 'YYYYMM');
    }
    constructor() {
        super('Category');
    }

    public setBudget(month: Date, amount: number) {
        const budget = this.get('budget') || {};
        budget[Category.getKey(month)] = amount;
        this.set('budget', budget);
    }

    public getBudget(month: Date): number {
        const budget = this.get('budget') || {};
        return (budget[Category.getKey(month)] || 0.0).toFixed(2);
    }

    public setActivity(month: Date, amount: number) {
        const activity = this.get('activity') || {};
        activity[Category.getKey(month)] = amount;
        this.set('activity', activity);
    }

    public hasActivity(month: Date): boolean {
        return has(this.get('activity'), Category.getKey(month));
    }

    public getActivity(month: Date): number {
        const activity = this.get('activity') || {};
        return activity[Category.getKey(month)] || 0;
    }

    public getFormattedActivity(month: Date): string {
        return formatter.format(this.getActivity(month), { code: 'USD' });
    }

    public getBalance(month: Date): number {
        const budget = this.get('budget');
        const activity = this.get('activity');
        const monthKey = Category.getKey(month);

        const accumulatePrevious = (total: number, val: number, key: string) => {
            if (key <= monthKey) {
                total += val;
            }
            return total;
        };

        const totalBudget = reduce(budget, accumulatePrevious, 0);
        const totalActivity = reduce(activity, accumulatePrevious, 0);
        return totalBudget + totalActivity;
    }

    public getFormattedBalance(month: Date): string {
        return formatter.format(this.getBalance(month), { code: 'USD' });
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;

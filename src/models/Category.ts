import Parse from './Parse';
import PrivateModel from './PrivateModel';
import CategoryGroup from './CategoryGroup';
import Account from './Account';
import { reduce, has } from 'lodash';
import { format } from 'date-fns';
import { formatMoney, sanitizeMoney, addMoney, moneyAsFloat } from './Money';

class Category extends PrivateModel {
    public static getKey(month: Date): string {
        return format(month, 'YYYYMM');
    }

    constructor() {
        super('Category');
    }

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

    public setBudget(month: Date, amount: string) {
        const budget = this.get('budget') || {};
        budget[Category.getKey(month)] = moneyAsFloat(amount);
        this.set('budget', budget);
    }

    public getBudget(month: Date): string {
        const budget = this.get('budget') || {};
        return sanitizeMoney((budget[Category.getKey(month)] || 0.0));
    }

    public setActivity(month: Date, amount: string | number) {
        const activity = this.get('activity') || {};
        activity[Category.getKey(month)] = moneyAsFloat(amount);
        this.set('activity', activity);
    }

    public hasActivity(month: Date): boolean {
        return has(this.get('activity'), Category.getKey(month));
    }

    public getActivity(month: Date): string {
        const activity = this.get('activity') || {};
        return sanitizeMoney(activity[Category.getKey(month)] || 0);
    }

    public getFormattedActivity(month: Date): string {
        return formatMoney(this.getActivity(month));
    }

    public getBalance(month: Date): string {
        const budget = this.get('budget');
        const activity = this.get('activity');
        const monthKey = Category.getKey(month);

        const accumulatePrevious = (total: string, val: string, key: string) => {
            if (key <= monthKey) {
                total = addMoney(total, sanitizeMoney(val));
            }
            return total;
        };

        const totalBudget = reduce(budget, accumulatePrevious, sanitizeMoney(0));
        const totalActivity = reduce(activity, accumulatePrevious, sanitizeMoney(0));
        return addMoney(totalBudget, totalActivity);
    }

    public getFormattedBalance(month: Date): string {
        return this.format(this.getBalance(month));
    }

    public set goal(goal: string) {
        this.set('goal', moneyAsFloat(goal));
    }

    public get goal(): string {
        return sanitizeMoney(this.get('goal'));
    }

    public get formattedGoal(): string {
        return formatMoney(this.goal);
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;

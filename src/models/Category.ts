import Parse from './Parse';
import PrivateModel from './PrivateModel';
import CategoryGroup from './CategoryGroup';
import Account from './Account';
import { reduce, has } from 'lodash';
import { format } from 'date-fns';
import { formatMoney, sanitizeMoney, addMoney, moneyAsFloat, isMoneyPositive } from './Money';

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

    public setBudget(month: Date, amount: number) {
        const budget = this.get('budget') || {};
        budget[Category.getKey(month)] = moneyAsFloat(amount);
        this.set('budget', budget);
    }

    public getBudget(month: Date): number {
        const budget = this.get('budget') || {};
        return moneyAsFloat((budget[Category.getKey(month)] || 0.0));
    }

    public setActivity(month: Date, amount: number | number) {
        const activity = this.get('activity') || {};
        activity[Category.getKey(month)] = moneyAsFloat(amount);
        this.set('activity', activity);
    }

    public hasActivity(month: Date): boolean {
        return has(this.get('activity'), Category.getKey(month));
    }

    public getActivity(month: Date): number {
        const activity = this.get('activity') || {};
        return moneyAsFloat(activity[Category.getKey(month)] || 0);
    }

    public getFormattedActivity(month: Date): string {
        return formatMoney(this.getActivity(month));
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
        return moneyAsFloat(totalBudget + totalActivity);
    }

    public getFormattedBalance(month: Date): string {
        return formatMoney(this.getBalance(month));
    }

    public set goal(goal: number) {
        this.set('goal', moneyAsFloat(goal));
    }

    public get goal(): number {
        return moneyAsFloat(this.get('goal'));
    }

    public get hasGoal(): boolean {
        return this.has('goal');
    }

    public get formattedGoal(): string {
        return formatMoney(this.goal);
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;

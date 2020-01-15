import Model from './Model';
import { reduce, has } from 'lodash';
import { format } from 'date-fns';
import { formatMoney, moneyAsFloat } from './Money';

interface Budget {
    [category: string]: number;
}

export default class Category extends Model {
    public static getKey(month: Date): string {
        return format(month, 'YYYYMM');
    }

    public groupId!: string;
    public paymentAccountId!: string;
    public budget!: Budget;
    public activity!: Budget;
    public name!: string;
    public goal!: number;

    // public formattedName(): string {
    //   if (this.isPayment) {
    //     return `Payment: ${this.paymentAccount.name}`;
    //   }
    //   return this.name;
    // }

    get isPayment(): boolean {
        return !!this.paymentAccountId;
    }

    public setBudget(month: Date, amount: number) {
        const budget = this.budget || {};
        budget[Category.getKey(month)] = moneyAsFloat(amount);
        this.budget = budget;
    }

    public getBudget(month: Date): number {
        const budget = this.budget || {};
        return moneyAsFloat(budget[Category.getKey(month)] || 0.0);
    }

    public setActivity(month: Date, amount: number | number) {
        const activity = this.activity || {};
        activity[Category.getKey(month)] = moneyAsFloat(amount);
        this.activity = activity;
    }

    public hasActivity(month: Date): boolean {
        return has(this.activity, Category.getKey(month));
    }

    public getActivity(month: Date): number {
        const activity = this.activity || {};
        return moneyAsFloat(activity[Category.getKey(month)] || 0);
    }

    public getFormattedActivity(month: Date): string {
        return formatMoney(this.getActivity(month));
    }

    public getBalance(month: Date): number {
        const budget = this.budget;
        const activity = this.activity;
        const monthKey = Category.getKey(month);

        const accumulatePrevious = (
            total: number,
            val: number,
            key: string
        ) => {
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

    public get hasGoal(): boolean {
        return !!this.goal;
    }

    public get formattedGoal(): string {
        return formatMoney(this.goal);
    }
}

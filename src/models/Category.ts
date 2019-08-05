import Parse from './Parse';
import PrivateModel from './PrivateModel';
import formatter from 'currency-formatter';


class Category extends PrivateModel {
    constructor() {
        super('Category');
    }

    get name(): string {
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }

    public setBudget(monthKey: string, amount: number) {
        const budget = this.get('budget') || {};
        budget[monthKey] = amount;
        this.set('budget', budget);
    }

    public getBudget(monthKey: string): number {
        const budget = this.get('budget') || {};
        return (budget[monthKey] || 0.0).toFixed(2);
    }

    get activity(): number {
        return 73;
    }

    get formattedActivity(): string {
        return formatter.format(this.activity, { code: 'USD' });
    }

    get balance(): number {
        return this.budget - this.activity;
    }

    get formattedBalance(): string {
        return formatter.format(this.balance, { code: 'USD' });
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;

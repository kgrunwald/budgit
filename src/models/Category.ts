import Parse from './Parse';
import PrivateModel from './PrivateModel';
import formatter from 'currency-formatter';
import CategoryGroup from './CategoryGroup';


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

    set group(group: CategoryGroup) {
        this.set('group', group);
    }

    get group(): CategoryGroup {
        return this.get('group');
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

    public setActivity(monthKey: string, amount: number) {
        const activity = this.get('activity') || {};
        activity[monthKey] = amount;
        this.set('activity', activity);
    }

    public getActivity(monthKey: string): number {
        const activity = this.get('activity') || {};
        return activity[monthKey] || 0;
    }

    public getFormattedActivity(monthKey: string): string {
        return formatter.format(this.getActivity(monthKey), { code: 'USD' });
    }

    public getBalance(monthKey: string): number {
        return this.getBudget(monthKey) - this.getActivity(monthKey);
    }

    public getFormattedBalance(monthKey: string): string {
        return formatter.format(this.getBalance(monthKey), { code: 'USD' });
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;

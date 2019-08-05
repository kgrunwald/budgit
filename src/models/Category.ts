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

    get budget(): number {
        // return this.get('budget');
        return 207;
    }

    set budget(budget: number) {
        this.set('budget', budget);
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

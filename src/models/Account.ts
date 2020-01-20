import Model from './Model';
import { field } from './Metadata';
import { formatMoney, moneyAsFloat } from './Money';

export default class Account implements Model {
    @field public id!: string;
    @field public accountId!: string;
    @field public itemId!: string;
    @field public name!: string;
    @field public type!: string;
    @field public subType!: string;
    @field public color!: string;
    @field public refreshToken!: string;
    @field public expired!: boolean;
    @field public available: number = 0;
    @field public current: number = 0;

    @field public logoStr: string = '';

    get availableBalance(): number {
        return moneyAsFloat(this.available);
    }

    set availableBalance(balance: number) {
        this.available = moneyAsFloat(balance);
    }

    get currentBalance(): number {
        return moneyAsFloat(this.current);
    }

    set currentBalance(balance: number) {
        this.current = moneyAsFloat(balance);
    }

    get formattedCurrentBalance(): string {
        return formatMoney(this.currentBalance);
    }

    get logo(): string {
        return this.logoStr;
    }

    set logo(logo: string) {
        this.logoStr = `data:image/png;base64, ${this.logo}`;
    }
}

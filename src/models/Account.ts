/* tslint:disable */
if (typeof window !== 'undefined') {
    var Parse = require('parse');
} else {
    var Parse = require('parse/node');
}
/* tslint:enable */

export class Account extends Parse.Object {
    constructor() {
        super('Account');
    }

    get accountId(): string {
        return this.get('accountId');
    }

    set accountId(id: string) {
        this.set('accountId', id);
    }

    get availableBalance(): number {
        return this.get('available');
    }

    set availableBalance(balance: number) {
        this.set('available', balance);
    }

    get currentBalance(): number {
        return this.get('current');
    }

    set currentBalance(balance: number) {
        this.set('current', balance);
    }

    get name(): string {
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }

    get type(): string {
        return this.get('type');
    }

    set type(type: string) {
        this.set('type', type);
    }

    get subType(): string {
        return this.get('subType');
    }

    set subType(type: string) {
        this.set('subType', type);
    }

    get logo(): string {
        return this.get('logo');
    }

    set logo(logo: string) {
        this.set('logo', `data:image/png;base64, ${logo}`);
    }

    get color(): string {
        return this.get('color');
    }

    set color(color: string) {
        this.set('color', color);
    }
}

Parse.Object.registerSubclass('Account', Account);
export default Account;

import Model from './Model';
import { field } from './Metadata';

export default class Item extends Model {
    @field public accessToken!: string;
    @field public itemId!: string;

    private privateTest!: string;

    @field
    get test(): string {
        return 'Getter Called';
    }

    set test(t: string) {
        this.privateTest = 'Setter Called';
    }
}

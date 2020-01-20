import Model from './Model';
import { field } from './Metadata';

export default class CategoryGroup implements Model {
    @field public id!: string;
    @field public name!: string;
    @field public hidden!: boolean;
}

import Model from './Model';
import { field } from './Metadata';

export default class PlaidCategoryMapping implements Model {
    @field public id!: string;
    @field public plaidCategoryId!: string;
    @field public categoryId!: string;
}

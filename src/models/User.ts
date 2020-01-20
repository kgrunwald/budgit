import Model from './Model';
import { field } from './Metadata';

export default class User implements Model {
    @field public id!: string;
    @field public email?: string;
    @field public username?: string;
    @field public password?: string;
    @field public firstName?: string;
    @field public lastName?: string;
}

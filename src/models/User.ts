import Model from './Model';
import { field } from './Metadata';

export default class User extends Model {
    @field public email?: string;
    @field public username?: string;
    @field public password?: string;
    @field public firstName?: string;
    @field public lastName?: string;
}

import { field } from './Metadata';

export default class Model {
    @field public id!: string;
    @field public userId!: string;
}

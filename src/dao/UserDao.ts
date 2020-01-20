import { Dao, DaoBase } from './Dao';
import User from '../models/User';
import FirebaseDao from './Firebase';

class UserDao extends DaoBase<User> {
    constructor(dao?: Dao<User>) {
        if (!dao) {
            dao = new FirebaseDao<User>(User);
        }

        super(dao, 'User');
        dao.setCollectionName(`Users`);
    }

    public byUsername(username: string): Promise<User | undefined> {
        return this.dao.first('username', username);
    }
}

export default UserDao;

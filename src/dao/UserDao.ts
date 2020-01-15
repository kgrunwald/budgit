import Dao from './Dao';
import User from '../models/User';

class UserDao extends Dao<User> {
    constructor() {
        super(User);
    }

    public byUsername(username: string): Promise<User | undefined> {
        return this.first('username', username);
    }

    public async byId(userId: string): Promise<User | undefined> {
        return this.get(userId);
    }

    public async current(): Promise<User> {
        return new User();
    }
}

export default UserDao;

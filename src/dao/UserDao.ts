import Dao from './Dao';
import User from '../models/User';

class UserDao extends Dao {
  protected clazz = User;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public byUsername(username: string): Promise<User | undefined> {
    return this.first('username', username);
  }

  public async byId(userId: string): Promise<User> {
    return this.get(userId);
  }
}

export default UserDao;

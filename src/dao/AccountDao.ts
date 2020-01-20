import { Dao, DaoBase } from './Dao';
import Account from '../models/Account';
import User from '../models/User';
import FirebaseDao from './Firebase';

class AccountDao extends DaoBase<Account> {
    constructor(user: User, dao?: Dao<Account>) {
        if (!dao) {
            dao = new FirebaseDao<Account>(Account);
        }

        super(dao, 'Account');
        dao.setCollectionName(`Users/${user.id}/Accounts`);
    }

    public async byAccountId(accountId: string): Promise<Account> {
        const acct = await this.dao.first('accountId', accountId);
        if (!acct) {
            throw new Error('Could not find account by id: ' + accountId);
        }
        return acct;
    }

    public byItemId(itemId: string): Promise<Account[]> {
        return this.dao.find('itemId', itemId);
    }

    public getOrCreate(accountId: string): Promise<Account> {
        return this.dao.getOrCreate('accountId', accountId);
    }
}

export default AccountDao;

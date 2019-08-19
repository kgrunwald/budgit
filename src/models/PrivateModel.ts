import Parse from './Parse';
import User from './User';

class PrivateModel extends Parse.Object {
    constructor(className: string) {
        super(className);
    }

    public async commit(user?: User, options?: any): Promise<void> {
        if (!user) {
            user = User.current();
        }

        this.set('user', user);
        this.setACL(new Parse.ACL(user));
        await super.save(null, options);
    }
}

export default PrivateModel;

import Parse from './Parse';

class PrivateModel extends Parse.Object {
    constructor(className: string) {
        super(className);
    }

    public async commit(user?: Parse.User): Promise<void> {
        if (!user) {
            user = Parse.User.current();
        }

        this.set('user', user);
        this.setACL(new Parse.ACL(user));
        await super.save();
    }
}

export default PrivateModel;

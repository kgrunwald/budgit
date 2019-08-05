import Parse from './Parse';

class PrivateModel extends Parse.Object {
    constructor(className: string) {
        super(className);
    }

    public async commit(): Promise<void> {
        this.setACL(new Parse.ACL(Parse.User.current()));
        await super.save();
    }
}

export default PrivateModel;

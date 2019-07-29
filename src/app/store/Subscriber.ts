import Parse from 'parse';

interface LiveQueryHandler {
    add(obj: Parse.Object): void;
    remove(obj: Parse.Object): void;
}

class Subscriber {
    constructor(private t: Parse.Object, private handler: LiveQueryHandler) {}

    public async subscribe() {
        // @ts-ignore
        const query = new Parse.Query(this.t);
        const subscription = await query.subscribe();

        subscription.on('create', (obj: Parse.Object) => {
            this.handler.add(obj);
        });

        subscription.on('enter', (obj: Parse.Object) => {
            this.handler.add(obj);
        });

        subscription.on('delete', (obj: Parse.Object) => {
            this.handler.remove(obj);
        });

        subscription.on('leave', (obj: Parse.Object) => {
            this.handler.remove(obj);
        });
    }
}

export default Subscriber;

import Parse from 'parse';

interface LiveQueryHandler {
    add(obj: Parse.Object): void;
    remove(obj: Parse.Object): void;
}

class Subscriber {
    constructor(
        private t: Parse.Object,
        private handler: LiveQueryHandler,
        private subscription: Parse.LiveQuerySubscription,
    ) {}

    public async subscribe() {
        // @ts-ignore
        const query = new Parse.Query(this.t);
        this.subscription = await query.subscribe();
        if (!this.subscription) {
            this.resubscribe();
        }

        this.subscription.on('create', (obj: Parse.Object) => {
            this.handler.add(obj);
        });

        this.subscription.on('enter', (obj: Parse.Object) => {
            this.handler.add(obj);
        });

        this.subscription.on('update', (obj: Parse.Object) => {
            console.log('update');
            this.handler.add(obj);
        });

        this.subscription.on('delete', (obj: Parse.Object) => {
            this.handler.remove(obj);
        });

        this.subscription.on('leave', (obj: Parse.Object) => {
            this.handler.remove(obj);
        });

        this.subscription.on('error', this.resubscribe);
    }

    private resubscribe() {
        console.log('Subscription error, retrying');
        setTimeout(this.subscribe, 1000);
    }
}

export default Subscriber;

import Parse from 'parse';

interface LiveQueryHandler {
    add(obj: any): void;
    remove(obj: any): void;
}

class Subscriber {
    private subscription!: Parse.LiveQuerySubscription;

    constructor(
        private query: Parse.Query,
        private handler: LiveQueryHandler,
    ) {}

    public async subscribe() {
        // @ts-ignore
        this.subscription = await this.query.subscribe();
        if (!this.subscription) {
            this.resubscribe();
        }

        this.subscription.on('open', () => {
            console.log(`[Subscriber] Opened ${this.query.className}`);
        });

        this.subscription.on('create', (obj: Parse.Object) => {
            console.log(`[Subscriber] New ${this.query.className}`);
            this.handler.add(obj);
        });

        this.subscription.on('enter', (obj: Parse.Object) => {
            console.log(`[Subscriber] Enter ${this.query.className}`);
            this.handler.add(obj);
        });

        this.subscription.on('update', (obj: Parse.Object) => {
            console.log(`[Subscriber] Update ${this.query.className}`);
            this.handler.add(obj);
        });

        this.subscription.on('delete', (obj: Parse.Object) => {
            console.log(`[Subscriber] Delete ${this.query.className}`);
            this.handler.remove(obj);
        });

        this.subscription.on('leave', (obj: Parse.Object) => {
            console.log(`[Subscriber] Leave ${this.query.className}`);
            this.handler.remove(obj);
        });

        this.subscription.on('close', () => {
            console.log(`[Subscriber] Close ${this.query.className}`);
        });

        this.subscription.on('error', this.resubscribe);
    }

    private resubscribe() {
        console.log(`[Subscriber] Error on ${this.query.className}. Resubscribing.`);
        setTimeout(this.subscribe, 1000);
    }
}

export default Subscriber;

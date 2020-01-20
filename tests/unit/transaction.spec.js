import Transaction from '@/models/Transaction';
describe('Transaction Model', () => {
    it('sets amount from string', () => {
        const txn = new Transaction();
        // @ts-ignore
        txn.amount = '123.45987';
        expect(txn.amount).toBe(123.46);
    });
    it('sets amount from float', () => {
        const txn = new Transaction();
        txn.amount = 34.2243;
        expect(txn.amount).toBe(34.22);
    });
    it('gets formatted amount', () => {
        const txn = new Transaction();
        txn.amount = 5893.23;
        expect(txn.formattedAmount).toBe('$5,893.23');
    });
    it('rounds amount', () => {
        const txn = new Transaction();
        txn.amount = 5893.23567;
        expect(txn.amount).toBe(5893.24);
    });
});
//# sourceMappingURL=transaction.spec.js.map
import Parse from 'parse/node';
import Transaction from '../../models/Transaction';
import Account from '../../models/Account';
import Category from '../../models/Category';
import { reduce, get } from 'lodash';
import { setDate, addMonths } from 'date-fns'
import { addMoney, moneyAsFloat } from '../../models/Money';

Parse.Cloud.afterSave(Transaction, async (req): Promise<void> => {
    const orig = req.original as unknown as Transaction;
    const update = req.object as unknown as Transaction;

    const origCatId = get(orig, 'category.id');
    const updateCatId = get(update, 'category.id');

    if (origCatId === updateCatId) {
        console.log('[CLOUD] No category change, skipping afterSave hook');
        return;
    }

    if (origCatId) {
        console.log('[CLOUD] Calculating activity for OLD transaction');
        await setCategoryActivity(orig);
    } else {
        console.log('[CLOUD] No previous category for txn. Updating account balance.')
        await updateAccountBalance(update);
    }
    
    if (updateCatId) {
        console.log('[CLOUD] Calculating activity for NEW transaction');
        await setCategoryActivity(update);
    }
})

const setCategoryActivity = async (txn: Transaction) => {
    // @ts-ignore
    const ctg = await new Parse.Query(Category).get(txn.category.id, { useMasterKey: true }) as Category;
    if (!ctg) {
        console.log('[CLOUD] No category found for transaction');
        return;
    }

    // @ts-ignore
    const acct = await new Parse.Query(Account).get(txn.account.id, { useMasterKey: true }) as Account;
    if (ctg.isPayment) {
        console.log(`[CLOUD] Transaction ${txn.transactionId} is marked as a payment. Looking up corresponding account.`);
        if (acct && acct.type !== 'credit') {
            console.log(`[CLOUD] Account ${acct.accountId} associated with transaction ${txn.transactionId} is not a credit account, skipping`);
            return;
        }
    }
    
    const begin = setDate(txn.date, 1);
    const end = addMonths(begin, 1);

    console.log(`[CLOUD] Loading transactions between: ${Category.getKey(begin)} and ${Category.getKey(end)} for ${ctg.name}`);
    // @ts-ignore
    const txns = await new Parse.Query(Transaction)
        .equalTo('category', ctg)
        .greaterThanOrEqualTo('date', begin)
        .lessThan('date', end)
        .find({ useMasterKey: true });
    const activity = reduce(txns, (val, txn) => addMoney(val, txn.amount), '0.00');
    console.log(`[CLOUD] Total for ${txns.length} transactions: $${activity}`);
    console.log(`[CLOUD] Setting activity for key: ${Category.getKey(begin)}`);

    ctg.setActivity(begin, activity);
    await ctg.save(null, { useMasterKey: true });

    if (acct.type === 'credit') {
        await setCreditActivity(txn, acct);
    }
}

const setCreditActivity = async (txn: Transaction, acct: Account) => {
    const begin = setDate(txn.date, 1);
    const end = addMonths(begin, 1);

    // @ts-ignore
    const paymentCtg = await new Parse.Query(Category).equalTo('paymentAccount', acct).first({ useMasterKey: true });
    if (paymentCtg) {
        // @ts-ignore
        const txns = await new Parse.Query(Transaction)
            .equalTo('account', acct)
            .greaterThanOrEqualTo('date', begin)
            .lessThan('date', end)
            .find({ useMasterKey: true });

        const activity = reduce(txns, (val, txn) => addMoney(val, txn.amount), '0.00');
        paymentCtg.setActivity(begin, activity);

        console.log('[CLOUD] Setting payment activity for credit category: ' + paymentCtg.id + ' ' + activity);
        await paymentCtg.save(null, { useMasterKey: true });
    } else {
        console.error('[CLOUD] No payment category found for account ' + acct.accountId);
    }
}

const updateAccountBalance = async (txn: Transaction) => {
    // @ts-ignore
    const txns = await new Parse.Query(Transaction).equalTo('account', txn.account).find({ useMasterKey: true });
    const balance = moneyAsFloat(reduce(txns, (val, txn) => addMoney(val, txn.amount), '0.00'));

    // @ts-ignore
    const acct = await new Parse.Query(Account).get(txn.account.id, { useMasterKey: true }) as Account;
    if (acct.currentBalance !== balance) {
        console.log(`[CLOUD] Setting account balance for ${acct.accountId}: ${balance}`, balance);
        acct.currentBalance = balance;
        return await acct.save(null, { useMasterKey: true });
    } else {
        console.log('[CLOUD] Account balance did not change.')
    }
}
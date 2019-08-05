import Parse from 'parse/node';
import Transaction from '../../models/Transaction';
import Category from '../../models/Category';
import { format } from 'date-fns'; 
import { reduce } from 'lodash';

Parse.Cloud.afterSave(Transaction, async (req): Promise<void> => {
    const txn = req.object as unknown as Transaction;
    const oldTxn = req.original as unknown as Transaction;

    await handleCategoryChange(oldTxn, txn);
})

const handleCategoryChange = async (oldTxn: Transaction, newTxn: Transaction) => {
    // @ts-ignore
    const query = new Parse.Query(Category);

    let ctg: Category | null = null;
    let oldCtg: Category | null = null;

    try {
        ctg = await query.get(newTxn.category.id, { useMasterKey: true }) as Category;
        oldCtg = await query.get(oldTxn.category.id, { useMasterKey: true })  as Category;
    } catch (e) {
        // noop
    }

    if (!ctg) {
        console.log('[CLOUD: afterSave] No category assigned');
        return;
    }

    const isChange = ctg.id !== (oldCtg && oldCtg.id);
    const key = format(newTxn.date, 'YYYYMM');

    const promises = [];
    if (!oldCtg || isChange) {
        console.log('[CLOUD: afterSave] Incrementing new category activity');
        const oldActivity = ctg.getActivity(key);
        ctg.setActivity(key, oldActivity + newTxn.amount);
        promises.push(ctg.save(null, { useMasterKey: true }));
    }

    if (oldCtg !== null) {
        console.log('[CLOUD: afterSave] Decrementing old category activity');
        const oldActivity = oldCtg.getActivity(key);
        oldCtg.setActivity(key, oldActivity - newTxn.amount);
        promises.push(oldCtg.save(null, { useMasterKey: true }));
    }

    await Promise.all(promises);
}

Parse.Cloud.beforeSave(Category, (request) => {
    const ctg = request.object as unknown as Category;
    const budgets = ctg.get('budget');
    const activity = ctg.get('activity');

    const totalBudget = reduce(budgets, (res, val) => res + val, 0);
    const totalActivity = reduce(activity, (res, val) => res + val, 0);
    ctg.total = totalBudget - totalActivity;
});
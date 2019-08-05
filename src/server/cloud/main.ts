import Parse from 'parse/node';
import Transaction from '../../models/Transaction';
import Category from '../../models/Category';
import { format } from 'date-fns'; 

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
        const oldBalance = ctg.getActivity(key);
        ctg.setActivity(key, oldBalance + newTxn.amount);
        promises.push(ctg.save(null, { useMasterKey: true }));
    }

    if (oldCtg !== null) {
        console.log('[CLOUD: afterSave] Decrementing old category activity');
        const oldBalance = oldCtg.getActivity(key);
        oldCtg.setActivity(key, oldBalance - newTxn.amount);
        promises.push(oldCtg.save(null, { useMasterKey: true }));
    }

    await Promise.all(promises);
}
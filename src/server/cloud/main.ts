import Parse from 'parse/node';
import Transaction from '../../models/Transaction';
import Category from '../../models/Category';
import { reduce, get } from 'lodash';
import { setDate, addMonths } from 'date-fns'

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
    }
    
    if (updateCatId) {
        console.log('[CLOUD] Calculating activity for NEW transaction');
        await setCategoryActivity(update);
    }
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
    const date = newTxn.date;

    const promises = [];
    if (!oldCtg || isChange) {
        console.log(`[CLOUD: afterSave] Incrementing new category activity: ${ctg.name}`);
        const oldActivity = ctg.getActivity(date);
        ctg.setActivity(date, oldActivity + newTxn.amount);
        promises.push(ctg.save(null, { useMasterKey: true }));
    }

    if (oldCtg !== null) {
        console.log(`[CLOUD: afterSave] Decrementing old category activity: ${oldCtg.name}`);
        const oldActivity = oldCtg.getActivity(date);
        oldCtg.setActivity(date, oldActivity - newTxn.amount);
        promises.push(oldCtg.save(null, { useMasterKey: true }));
    }

    await Promise.all(promises);
}

const setCategoryActivity = async (txn: Transaction) => {
    // @ts-ignore
    const ctg = await new Parse.Query(Category).get(txn.category.id, { useMasterKey: true }) as Category;
    if (!ctg) {
        console.log('[CLOUD] No category found for transaction');
        return;
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

    const activity = reduce(txns, (val, txn) => val + txn.amount, 0);
    console.log(`[CLOUD] Total for ${txns.length} transactions: $${activity}`);
    console.log(`[CLOUD] Setting activity for key: ${Category.getKey(begin)}`);

    ctg.setActivity(begin, activity);
    await ctg.save(null, { useMasterKey: true });
}
import { Module, VuexModule, getModule } from 'vuex-module-decorators';
import Store from './index';


@Module({
    dynamic: true,
    store: Store,
    name: 'Categories',
    namespaced: true,
})
class CategoryModule extends VuexModule {
    public categories: string[] = [
        'Rent',
        'Utilities',
        'Pet',
        'Vacation',
        'Auto Loan - Tesla',
        'Lease Payment - Blazer',
        'Banana Stand',
        'House Down Payment',
    ];
}

export default getModule(CategoryModule);

<template>
    <div>
        <div class="category-filter-container">
            <b-form-input
                ref="category-filter-input"
                size="sm"
                v-model="filter"
            />
        </div>
        <b-list-group class="category-list-group">
            <b-list-group-item
                v-for="category in categories"
                :key="category.id"
                @click="select(category)"
                class="category-list-item"
                button
                >{{ category.name }}</b-list-group-item
            >
        </b-list-group>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { filter, startsWith } from 'lodash';
import CategoryModule from '../store/CategoryModule';
import Category from '@/models/Category';
import { BFormInput } from 'bootstrap-vue';

@Component({
    props: {
        category: Category,
        onChange: Function
    }
})
export default class CategorySearch extends Vue {
    public filter: string = '';

    get categories(): Category[] {
        return filter(CategoryModule.categories, ctg =>
            startsWith(ctg.name.toUpperCase(), this.filter.toUpperCase())
        );
    }

    public select(category: Category) {
        this.$props.onChange(category);
    }

    public focusSearch() {
        (this.$refs['category-filter-input'] as BFormInput).focus();
    }
}
</script>

<style lang="scss" scoped>
.category-filter-container {
    padding: 10px;
}
.category-list-group {
    max-height: 110px;
    overflow: scroll;
    .category-list-item {
        padding: 8px;
        border: none;
        width: 100%;
    }
}
</style>

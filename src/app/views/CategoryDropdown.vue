<template>
    <b-dropdown
        class="category-dropdown-container"
        :text="selectedCategoryName"
        split
        split-variant="outline-primary"
        variant="primary"
        size="sm"
    >
        <b-dropdown-form>
            <b-form-input
                class="testing"
                size="sm"
                v-model="filter"
            />
        </b-dropdown-form>
        <div class="dropdown-items-container">
            <b-dropdown-item 
                v-for="category in categories" 
                :key="category.id"
                @click="select(category)"
            >
                {{ category.name }}
            </b-dropdown-item>
        </div>
    </b-dropdown>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { filter, startsWith } from 'lodash';
import CategoryModule from '../store/CategoryModule';
import Category from '@/models/Category';

@Component({
    props: {
        onChange: Function,
    },
})
export default class CategoryDropdown extends Vue {
    public selectedCategoryName: string = '- Select Category -';
    public filter: string = '';

    get categories(): Category[] {
        return filter(CategoryModule.categories, (ctg) => startsWith(
            ctg.name.toUpperCase(),
            this.filter.toUpperCase(),
        ));
    }

    public select(category: Category) {
        this.selectedCategoryName = category.name;
        this.$props.onChange(category);
    }
}
</script>

<style lang="scss">

.category-dropdown-container {
    .dropdown-items-container {
        max-height: 160px;
        overflow: scroll;
    }
}

</style>
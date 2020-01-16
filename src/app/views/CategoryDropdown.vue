<template>
    <b-dropdown
        class="category-dropdown-container"
        :text="
            $props.category
                ? $props.category.categoryName
                : '- Select Category -'
        "
        split
        split-variant="outline-primary"
        variant="primary"
        size="sm"
        @shown="focusSearch"
    >
        <b-dropdown-form>
            <b-form-input
                autofocus
                ref="select-input"
                size="sm"
                v-model="filter"
                @keydown.enter.prevent
            />
        </b-dropdown-form>
        <div class="dropdown-items-container">
            <b-dropdown-item
                v-for="category in categories"
                :key="category.id"
                @click="select(category)"
                >{{ category.name }}</b-dropdown-item
            >
        </div>
    </b-dropdown>
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
export default class CategoryDropdown extends Vue {
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
        (this.$refs['select-input'] as BFormInput).focus();
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

<template>
  <div>
    <div class="budget-container">
      <b-card>
        <div class="budget-header">
          <div class="budget-info">
            <div class="budget-title">
              <span>Budget</span>
            </div>
            <div class="summary">
              <div class="balance">
                <div :class="1000 > 0 ? 'positive' : 'negative'">1000</div>
                <span class="info">Current Balance</span>
              </div>
              <div class="separator" />
              <div class="actions">
                <b-button pill variant="outline-primary" class="action">
                  <font-awesome-icon icon="cloud-download-alt" />Import
                </b-button>
              </div>
            </div>
          </div>
        </div>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Budget extends Vue {}
</script>

<style lang="scss" scoped >
@import '@/app/styles/custom.scss';

.budget-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #fafafa;
  overflow-y: scroll;

  .budget-header {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;

    .budget-info {
      width: 100%;
      display: flex;
      justify-content: space-between;

      .title {
        display: flex;
        flex-direction: column;
        font-size: 18px;
        font-weight: 500;
        width: 100%;
      }

      .summary {
        display: flex;

        .balance > div {
          width: 100%;
          text-align: right;

          .positive {
            color: $green;
          }

          .negative {
            color: $red;
          }

          .info {
            display: flex;
            flex-direction: column;
            text-transform: capitalize;
            font-size: 14px;
            font-weight: 300;
          }
        }

        .actions {
          margin-bottom: 5px;
          display: flex;
          flex-direction: column;
          font-size: 12px;

          .action {
            padding: 0 8px 0 8px;
            display: flex;
            height: 20px;
            align-items: center;
            margin-right: 5px;
            font-size: 12px;

            &:first-child {
              margin-bottom: 8px;
            }

            svg {
              margin-right: 5px;
            }
          }
        }
      }
    }
  }
  .card {
      margin-bottom: 5px;

      .card-body {
          padding: 0.75rem;
      }
  }

  .separator {
      border-right: 1px solid #ddd;
      margin: 0 16px;
  }
}
</style>




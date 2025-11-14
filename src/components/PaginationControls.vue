<template>
  <div class="pagination-container">
    <div class="pagination-info">
      <span>Rows per page:</span>
      <select
        class="rows-per-page-select"
        :value="rowsPerPage"
        @change="$emit('update:rowsPerPage', parseInt($event.target.value))"
      >
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
    </div>

    <div class="pagination-controls">
      <!-- Previous Button -->
      <button
        class="pagination-btn"
        :disabled="currentPage <= 1"
        @click="$emit('goToPage', currentPage - 1)"
      >
        <svg
          class="pagination-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      <!-- Page Numbers -->
      <div class="page-numbers">
        <template v-for="pageNum in totalPages" :key="pageNum">
          <button
            v-if="shouldShowPageNumber(pageNum)"
            class="page-number-btn"
            :class="{ active: pageNum === currentPage }"
            @click="$emit('goToPage', pageNum)"
          >
            {{ pageNum }}
          </button>
          <span v-else-if="shouldShowEllipsis(pageNum)" class="page-ellipsis">
            ...
          </span>
        </template>
      </div>

      <!-- Jump to Page -->
      <div class="jump-to-page">
        <input
          type="number"
          class="jump-to-page-input"
          placeholder="Page"
          min="1"
          :max="totalPages"
          :value="jumpToPageValue"
          @input="$emit('update:jumpToPageValue', $event.target.value)"
          @keyup.enter="$emit('jumpToPage')"
        />
        <button
          class="jump-btn"
          @click="$emit('jumpToPage')"
          :disabled="!jumpToPageValue || jumpToPageValue.length === 0"
        >
          Go
        </button>
      </div>

      <!-- Next Button -->
      <button
        class="pagination-btn"
        :disabled="currentPage >= totalPages"
        @click="$emit('goToPage', currentPage + 1)"
      >
        Next
        <svg
          class="pagination-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { usePaginationHelpers } from "../composables/usePaginationHelpers"

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  rowsPerPage: {
    type: Number,
    required: true,
  },
  jumpToPageValue: {
    type: String,
    default: "",
  },
})

defineEmits([
  "update:rowsPerPage",
  "goToPage",
  "update:jumpToPageValue",
  "jumpToPage",
])

const {
  shouldShowPageNumber: checkShowPageNumber,
  shouldShowEllipsis: checkShowEllipsis,
} = usePaginationHelpers()

function shouldShowPageNumber(pageNum) {
  return checkShowPageNumber(pageNum, props.currentPage, props.totalPages)
}

function shouldShowEllipsis(pageNum) {
  return checkShowEllipsis(pageNum, props.currentPage, props.totalPages)
}
</script>

<style scoped>
/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--bg-dark);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.rows-per-page-select {
  padding: 6px 10px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
  outline: none;
}

.rows-per-page-select:hover {
  border-color: var(--primary-blue);
}

.rows-per-page-select:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.page-info {
  color: var(--text-light);
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-icon {
  width: 16px;
  height: 16px;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-number-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-number-btn:hover {
  background-color: rgba(66, 153, 225, 0.2);
  border-color: var(--primary-blue);
}

.page-number-btn.active {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  font-weight: 600;
}

.page-ellipsis {
  padding: 0 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Jump to Page */
.jump-to-page {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--border-color);
}

.jump-to-page-input {
  width: 70px;
  padding: 8px 10px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.jump-to-page-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.jump-to-page-input::placeholder {
  color: var(--text-muted);
}

/* Remove spinner arrows from number input */
.jump-to-page-input::-webkit-inner-spin-button,
.jump-to-page-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.jump-to-page-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.jump-btn {
  padding: 8px 16px;
  background-color: var(--primary-blue);
  color: var(--text-light);
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-btn:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.jump-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
</style>

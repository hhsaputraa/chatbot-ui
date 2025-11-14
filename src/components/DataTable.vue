<template>
  <div class="table-container">
    <!-- Search Bar -->
    <SearchBar
      :search-query="searchQuery"
      :filtered-count="filteredCount"
      :total-count="totalCount"
      @update:search-query="handleSearchUpdate"
      @clear="handleClearSearch"
    />

    <!-- Table -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="headerKey in columns" :key="headerKey">
              {{ formatHeader(headerKey) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rowArray, rIndex) in paginatedRows"
            :key="rIndex"
            class="table-row"
          >
            <td v-for="(cellValue, cIndex) in rowArray" :key="cIndex">
              {{ formatCell(cellValue, columns[cIndex]) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- No Results Message -->
      <div
        v-if="filteredCount === 0 && searchQuery && searchQuery.length > 0"
        class="no-search-results"
      >
        <svg
          class="empty-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p>No results found for "{{ searchQuery }}"</p>
      </div>
    </div>

    <!-- Pagination Controls -->
    <PaginationControls
      v-if="filteredCount > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :rows-per-page="rowsPerPage"
      :jump-to-page-value="jumpToPageValue"
      @update:rows-per-page="handleRowsPerPageChange"
      @go-to-page="handleGoToPage"
      @update:jump-to-page-value="handleJumpInputUpdate"
      @jump-to-page="handleJumpToPage"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue"
import SearchBar from "./SearchBar.vue"
import PaginationControls from "./PaginationControls.vue"
import { useFormatting } from "../composables/useFormatting"
import { useTablePagination } from "../composables/useTablePagination"
import { usePaginationHelpers } from "../composables/usePaginationHelpers"

const props = defineProps({
  messageIndex: {
    type: Number,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
})

// Composables
const { formatCell, formatHeader } = useFormatting()
const {
  paginationState,
  searchState,
  jumpToPageInput,
  initPagination,
  updateSearch,
  clearSearch,
  getPaginatedRows,
  getTotalPages,
  getFilteredRowCount,
  goToPage,
  changeRowsPerPage,
} = useTablePagination()

const { handleJumpToPage: jumpToPageHelper, clearJumpToPageInput } =
  usePaginationHelpers()

// Initialize pagination on mount
onMounted(() => {
  initPagination(props.messageIndex, props.rows.length)
})

// Computed properties
const searchQuery = computed(() => searchState.value[props.messageIndex] || "")
const currentPage = computed(
  () => paginationState.value[props.messageIndex]?.currentPage || 1
)
const rowsPerPage = computed(
  () => paginationState.value[props.messageIndex]?.rowsPerPage || 10
)
const jumpToPageValue = computed(
  () => jumpToPageInput.value[props.messageIndex] || ""
)

const filteredCount = computed(() =>
  getFilteredRowCount(props.messageIndex, props.rows, props.columns, formatCell)
)

const totalCount = computed(() => props.rows.length)

const paginatedRows = computed(() =>
  getPaginatedRows(props.messageIndex, props.rows, props.columns, formatCell)
)

const totalPages = computed(() =>
  getTotalPages(props.messageIndex, filteredCount.value)
)

// Event handlers
function handleSearchUpdate(query) {
  updateSearch(props.messageIndex, query)
}

function handleClearSearch() {
  clearSearch(props.messageIndex)
}

function handleRowsPerPageChange(newValue) {
  changeRowsPerPage(props.messageIndex, newValue)
}

function handleGoToPage(page) {
  goToPage(props.messageIndex, page)
}

function handleJumpInputUpdate(value) {
  jumpToPageInput.value[props.messageIndex] = value
}

function handleJumpToPage() {
  jumpToPageHelper(
    props.messageIndex,
    jumpToPageValue.value,
    totalPages.value,
    goToPage,
    clearJumpToPageInput.bind(null, jumpToPageInput)
  )
}
</script>

<style scoped>
/* Table Container */
.table-container {
  margin-top: 10px;
}

/* Table Wrapper */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
  background-color: var(--bg-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container .table-wrapper {
  border-radius: 0;
  border-top: none;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: var(--bubble-bot-bg);
  color: var(--text-light);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.number-cell {
  text-align: right;
  font-family: "Consolas", "Monaco", monospace;
  color: #a0aec0;
  font-weight: 500;
}

.number-cell:empty::after {
  content: "-";
  color: var(--text-muted);
}

/* No Search Results */
.no-search-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.no-search-results .empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.no-search-results p {
  color: var(--text-muted);
  font-size: 0.95rem;
}
</style>

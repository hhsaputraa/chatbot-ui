<template>
  <div class="table-container">
    <div class="export-controls">
      <span>Export Data To:</span>
      <button @click="exportToCSV" class="export-btn csv">CSV</button>
      <button @click="exportToPDF" class="export-btn pdf">PDF</button>
      <button @click="exportToPDFv2" class="export-btn pdf v2">PDF v2</button>
    </div>
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
      <table class="data-table" :style="{ width: totalTableWidth + 'px' }">
        <thead>
          <tr>
            <th
              v-for="headerKey in columns"
              :key="headerKey"
              class="resizable-th"
              :style="{ width: getColumnWidth(headerKey) }"
            >
              <div class="header-content">
                {{ formatHeader(headerKey) }}
              </div>
              <!-- Resize Handle -->
              <div
                class="resize-handle"
                @mousedown.stop.prevent="startResize($event, headerKey)"
                @dblclick.stop.prevent="autoResize(headerKey)"
                title="Drag to resize, double-click to auto-fit"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rowArray, rIndex) in paddedRows"
            :key="rowKey(rowArray, rIndex)"
            class="table-row"
          >
            <td
              v-for="(cellValue, cIndex) in rowArray"
              :key="cIndex"
              :title="formatCell(cellValue, columns[cIndex])"
              :style="{ maxWidth: getColumnWidth(columns[cIndex]) }"
            >
              <!-- Display sequential number for id column while keeping actual id in data -->
              <template v-if="columns[cIndex] === 'id'">
                <span
                  v-if="
                    paginatedRows[rIndex] && paginatedRows[rIndex][0] !== ''
                  "
                  >{{ (currentPage - 1) * rowsPerPage + rIndex + 1 }}</span
                >
              </template>

              <!-- Action buttons only for real rows (have id) -->
              <template v-else-if="columns[cIndex] === 'action'">
                <template v-if="rowArray && rowArray[0]">
                  <button
                    class="action-btn edit"
                    @click.stop="emitEdit(rowArray)"
                  >
                    Edit
                  </button>
                  <button
                    class="action-btn delete"
                    @click.stop="emitDelete(rowArray)"
                  >
                    Delete
                  </button>
                </template>
              </template>

              <template v-else>
                {{ formatCell(cellValue, columns[cIndex]) }}
              </template>
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
import { computed, onMounted, watch, ref, reactive, onUnmounted } from "vue";
import SearchBar from "./SearchBar.vue";
import PaginationControls from "./PaginationControls.vue";
import { useFormatting } from "../composables/useFormatting";
import { useTablePagination } from "../composables/useTablePagination";
import { usePaginationHelpers } from "../composables/usePaginationHelpers";
import { useDataExport } from "../composables/useDataExport";
import { useToast } from "../composables/useToast";

// ... (imports remain the same)

// === CONSTANTS ===
const DEFAULT_COLUMN_WIDTH = 180; // Increased default
const MIN_COLUMN_WIDTH = 100;
const AUTO_RESIZE_PADDING = 32;
const MAX_COLUMN_WIDTH = 800;
const FONT_HEADER_MEASURE = "600 0.9rem 'Inter', sans-serif";
const FONT_CELL_MEASURE = "400 0.9rem 'Inter', sans-serif";

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
  keepHeight: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["edit-row", "delete-row"]);

function emitEdit(rowArray) {
  const id = rowArray && rowArray[0];
  emit("edit-row", id);
}

function emitDelete(rowArray) {
  const id = rowArray && rowArray[0];
  emit("delete-row", id);
}

const { formatCell, formatHeader } = useFormatting();
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
  getFilteredRows,
} = useTablePagination();

const { handleJumpToPage: jumpToPageHelper, clearJumpToPageInput } =
  usePaginationHelpers();

const {
  exportToCSV: exportCSV,
  exportToPDF: exportPDF,
  exportToPDFv2: exportPDFv2,
} = useDataExport();
const { addToast } = useToast();

onMounted(() => {
  initPagination(props.messageIndex, props.rows.length);
  initColumnWidths();
});

watch(
  () => props.rows.length,
  (newLen, oldLen) => {
    initPagination(props.messageIndex, props.rows.length);
  }
);

watch(
  () => props.columns,
  () => {
    initColumnWidths();
  },
  { deep: true }
);

const searchQuery = computed(() => searchState.value[props.messageIndex] || "");
const currentPage = computed(
  () => paginationState.value[props.messageIndex]?.currentPage || 1
);
const rowsPerPage = computed(
  () => paginationState.value[props.messageIndex]?.rowsPerPage || 10
);
const jumpToPageValue = computed(
  () => jumpToPageInput.value[props.messageIndex] || ""
);

const filteredCount = computed(() =>
  getFilteredRowCount(props.messageIndex, props.rows, props.columns, formatCell)
);

const totalCount = computed(() => props.rows.length);

const paginatedRows = computed(() =>
  getPaginatedRows(props.messageIndex, props.rows, props.columns, formatCell)
);

const paddedRows = computed(() => {
  const pageRows = paginatedRows.value || [];
  if (!props.keepHeight) return pageRows;
  const perPage = rowsPerPage.value || 10;
  const target = perPage;
  const colsCount = props.columns.length;
  const padded = pageRows.slice();
  while (padded.length < target) {
    const emptyRow = new Array(colsCount).fill("");
    padded.push(emptyRow);
  }
  return padded;
});

function rowKey(rowArray, rIndex) {
  const id = rowArray && rowArray[0];
  if (id) return String(id);
  return `empty-${rIndex}`;
}

const totalPages = computed(() =>
  getTotalPages(props.messageIndex, filteredCount.value)
);

function handleSearchUpdate(query) {
  updateSearch(props.messageIndex, query);
}

function handleClearSearch() {
  clearSearch(props.messageIndex);
}

function handleRowsPerPageChange(newValue) {
  changeRowsPerPage(props.messageIndex, newValue);
}

function handleGoToPage(page) {
  goToPage(props.messageIndex, page);
}

function handleJumpInputUpdate(value) {
  jumpToPageInput.value[props.messageIndex] = value;
}

function handleJumpToPage() {
  jumpToPageHelper(
    props.messageIndex,
    jumpToPageValue.value,
    totalPages.value,
    goToPage,
    clearJumpToPageInput.bind(null, jumpToPageInput)
  );
}

// === RESIZING LOGIC ===
const columnWidths = reactive({});

function initColumnWidths() {
  if (!props.columns || props.columns.length === 0) return;
  props.columns.forEach((col) => {
    if (!columnWidths[col]) {
      // Set reasonable defaults based on column name
      if (col === 'id') columnWidths[col] = 80; // Increased from 60
      else if (col === 'action') columnWidths[col] = 180;
      else if (col === 'category') columnWidths[col] = 200; // New specific default
      else if (col.includes('prompt')) columnWidths[col] = 300; // Wider prompt
      else if (col.includes('content') || col.includes('sql') || col.includes('query')) columnWidths[col] = 500; // Much wider for content
      else columnWidths[col] = 250; // Increased general default
    }
  });
}

const totalTableWidth = computed(() => {
  let sum = 0;
  props.columns.forEach(col => {
    sum += (columnWidths[col] || DEFAULT_COLUMN_WIDTH);
  });
  return Math.max(sum, 100); // Minimum safe width
});

function getColumnWidth(key) {
  return `${columnWidths[key] || DEFAULT_COLUMN_WIDTH}px`;
}

let resizingColumn = null;
let startX = 0;
let startWidth = 0;

function startResize(event, columnKey) {
  const parentTh = event.target.closest("th");
  if (!parentTh) return;

  resizingColumn = columnKey;
  startX = event.clientX;
  startWidth = columnWidths[columnKey] || parentTh.getBoundingClientRect().width;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onMouseMove(event) {
  if (!resizingColumn) return;

  const deltaX = event.clientX - startX;
  const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + deltaX);

  columnWidths[resizingColumn] = newWidth;
}

function onMouseUp() {
  resizingColumn = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

// === AUTO SIZE LOGIC (Double Click) ===
function autoResize(columnKey) {
  // 1. Measure Header
  const headerText = formatHeader(columnKey);
  let maxWidth = getTextWidth(headerText, FONT_HEADER_MEASURE);

  // 2. Measure Visible Rows (Current Page)
  const rowsToCheck = paginatedRows.value || [];
  const colIndex = props.columns.indexOf(columnKey);

  if (colIndex !== -1) {
    rowsToCheck.forEach((row) => {
      const cellValue = row[colIndex];
      const formatted = formatCell(cellValue, columnKey);
      // Limit check to first 100 chars to avoid perf issues on huge text
      const textToMeasure = formatted ? String(formatted).substring(0, 100) + (String(formatted).length > 100 ? '...' : '') : ''; 
      const w = getTextWidth(textToMeasure, FONT_CELL_MEASURE);
      if (w > maxWidth) maxWidth = w;
    });
  }

  // 3. Set Width
  columnWidths[columnKey] = Math.min(
    Math.max(maxWidth + AUTO_RESIZE_PADDING, MIN_COLUMN_WIDTH),
    MAX_COLUMN_WIDTH
  );
}

// Helper canvas for text measurement
let canvasContext = null;
function getTextWidth(text, font) {
  if (!canvasContext) {
    const canvas = document.createElement("canvas");
    canvasContext = canvas.getContext("2d");
  }
  canvasContext.font = font;
  return canvasContext.measureText(text).width;
}

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});

// === EXPORT LOGIC ===
function getExportPayload() {
  const filteredRows = getFilteredRows(
    props.messageIndex,
    props.rows,
    props.columns,
    formatCell
  );

  const headers = props.columns.map((col) => formatHeader(col));

  const body = filteredRows.map((rowArray) => {
    return rowArray.map((cellValue, cIndex) => {
      return formatCell(cellValue, props.columns[cIndex]);
    });
  });

  return { headers, body };
}

function exportToCSV() {
  exportCSV(getExportPayload());
  addToast({
    title: "Export CSV",
    message: "Sedang mengunduh CSV...",
    type: "success",
  });
}

async function exportToPDF() {
  try {
    addToast({
      title: "Export PDF",
      message: "Sedang memproses PDF...",
      type: "info",
    });
    await exportPDF(getExportPayload());
    addToast({
      title: "Berhasil",
      message: "PDF berhasil diexport.",
      type: "success",
    });
  } catch (e) {
    addToast({ title: "Gagal Export PDF", message: e.message, type: "error" });
  }
}

async function exportToPDFv2() {
  try {
    addToast({
      title: "Export PDF v2",
      message: "Sedang memproses PDF v2...",
      type: "info",
    });
    await exportPDFv2(getExportPayload());
    addToast({
      title: "Berhasil",
      message: "PDF v2 berhasil diexport.",
      type: "success",
    });
  } catch (e) {
    addToast({
      title: "Gagal Export PDF v2",
      message: e.message,
      type: "error",
    });
  }
}
</script>

<style scoped>
/* Table Container */
.table-container {
  margin-top: 10px;
}

/* Table Wrapper */
.table-wrapper {
  /* Enable both horizontal and vertical scrolling */
  overflow-x: auto;
  overflow-y: auto;
  /* Set maximum height to prevent table from growing too tall */
  max-height: 500px;
  border: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
  background-color: var(--bg-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* Smooth scrolling */
  scroll-behavior: smooth;
}

.export-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.export-controls span {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
}

.export-btn {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-light);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.export-btn.csv:hover {
  background-color: #38a169; /* Hijau */
  border-color: #38a169;
}

.export-btn.pdf:hover {
  background-color: #e53e3e; /* Merah */
  border-color: #e53e3e;
}

/* Sesuaikan SearchBar agar tidak punya border radius atas */
.table-container .search-container {
  border-radius: 0;
  border-top: none;
}

/* Data Table */
.data-table {
  /* width is now controlled via inline style from JS */
  min-width: 100%; /* Ensure table fills container by default */
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  table-layout: fixed; /* Strictly fixed layout */
}

/* Resizable Header Th */
.resizable-th {
  position: relative;
  /* min-width handled in JS, but nice to have backup */
  min-width: 80px; 
  background-clip: padding-box;
  text-transform: uppercase; /* More formal look */
  letter-spacing: 0.05em;
  font-size: 0.8rem;
}

.header-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 20px; /* Room for handle */
}

/* RESIZE HANDLE */
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 12px; /* Wider hit area */
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 20; 
  user-select: none;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Visual indicator line inside handle (optional) */
.resize-handle::after {
  content: "";
  display: block;
  width: 2px;
  height: 60%;
  background-color: var(--border-color);
  opacity: 0;
  transition: opacity 0.2s;
}

.resize-handle:hover::after,
.resizable-th:hover .resize-handle::after {
  opacity: 1;
}

.resize-handle:hover {
  background-color: rgba(66, 153, 225, 0.1); 
}

/* Active resizing state */
.resize-handle:active {
  background-color: rgba(66, 153, 225, 0.3);
}

.resize-handle:active::after {
  background-color: var(--primary-blue);
  opacity: 1;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color); /* Add vertical borders for clearer definition */

  /* Text overflow handling */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  vertical-align: middle;
  box-sizing: border-box;
}

.data-table th:last-child,
.data-table td:last-child {
  border-right: none;
}

.data-table th {
  background-color: #1e293b; /* Slightly lighter/bluer header bg */
  color: var(--text-light);
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid var(--border-color); /* Thicker bottom border for header */
}

.data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  cursor: default;
}

/* Specific column width adjustments can go here if needed */

/* Scrollbar Styling */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: var(--bg-darker);
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--primary-blue);
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

.action-btn {
  padding: 6px 8px;
  margin-right: 6px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-light);
  cursor: pointer;
  font-size: 0.85rem;
}
.action-btn.edit:hover {
  background: rgba(56, 161, 105, 0.12);
}
.action-btn.delete:hover {
  background: rgba(229, 62, 62, 0.12);
}

/* Responsive Design */
@media (max-width: 768px) {
  .data-table {
    table-layout: auto; /* Fallback on mobile to auto layout usually better, or keep fixed */
  }
}
</style>

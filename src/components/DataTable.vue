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
      <table class="data-table">
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
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import PaginationControls from "./PaginationControls.vue";
import { useFormatting } from "../composables/useFormatting";
import { useTablePagination } from "../composables/useTablePagination";
import { usePaginationHelpers } from "../composables/usePaginationHelpers";

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
  // key to trigger reset (e.g., collection name)
  resetKey: {
    type: [String, Number],
    required: false,
    default: null,
  },
  // keep table height by padding rows to rowsPerPage (optional)
  keepHeight: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["edit-row", "delete-row"]);

function emitEdit(rowArray) {
  // assume id is at index 0
  const id = rowArray && rowArray[0];
  emit("edit-row", id);
}

function emitDelete(rowArray) {
  const id = rowArray && rowArray[0];
  emit("delete-row", id);
}

// Composables
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
  // getFilteredRows, // Not directly used in template, checking usage... Used in Export
  getFilteredRows,
} = useTablePagination();

const { handleJumpToPage: jumpToPageHelper, clearJumpToPageInput } =
  usePaginationHelpers();

// Initialize pagination on mount
onMounted(() => {
  initPagination(props.messageIndex, props.rows.length);
});

// Watch for explicit reset key (e.g., collection change) and rows length changes
watch(
  () => props.resetKey,
  () => {
    // reset search and pagination for this messageIndex
    clearSearch(props.messageIndex);
    initPagination(props.messageIndex, props.rows.length);
  }
);

watch(
  () => props.rows.length,
  (newLen, oldLen) => {
    // if number of rows changed drastically, re-init pagination to avoid staying on invalid page
    initPagination(props.messageIndex, props.rows.length);
  }
);

// Computed properties
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

// Optionally ensure table keeps stable height by padding rows when last page has fewer items
const paddedRows = computed(() => {
  const pageRows = paginatedRows.value || [];
  if (!props.keepHeight) return pageRows;
  const perPage = rowsPerPage.value || 10; // Default fallback to 10
  const target = perPage;
  const colsCount = props.columns.length;
  const padded = pageRows.slice();
  while (padded.length < target) {
    // create an empty row with same number of columns
    const emptyRow = new Array(colsCount).fill("");
    padded.push(emptyRow);
  }
  return padded;
});

function rowKey(rowArray, rIndex) {
  // For real rows use the id if present (first column), otherwise fallback to index
  const id = rowArray && rowArray[0];
  if (id) return String(id);
  return `empty-${rIndex}`;
}

const totalPages = computed(() =>
  getTotalPages(props.messageIndex, filteredCount.value)
);

// Event handlers
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

// === COLUMN RESIZING LOGIC ===
const columnWidths = reactive({}); // Stores specific widths for columns key: width(px)

function getColumnWidth(key) {
  if (columnWidths[key]) {
    return `${columnWidths[key]}px`;
  }
  // Force a default pixel width for Fixed Layout to respect.
  // Prevents "squashing" by forcing table to grow.
  return "150px";
}

// Variables for resizing
let resizingColumn = null;
let startX = 0;
let startWidth = 0;

function startResize(event, columnKey) {
  const parentTh = event.target.closest("th");
  if (!parentTh) return;

  resizingColumn = columnKey;
  startX = event.clientX;
  startWidth = parentTh.getBoundingClientRect().width;

  // Add global listeners
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  // Add resizing class to body to force cursor
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none"; // Prevent text selection
}

function onMouseMove(event) {
  if (!resizingColumn) return;

  const deltaX = event.clientX - startX;
  const newWidth = Math.max(80, startWidth + deltaX); // Min width 80px

  columnWidths[resizingColumn] = newWidth;
}

function onMouseUp() {
  resizingColumn = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  // Reset body style
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

// === AUTO SIZE LOGIC (Double Click) ===
function autoResize(columnKey) {
  // 1. Measure Header
  const headerText = formatHeader(columnKey);
  let maxWidth = getTextWidth(headerText, "600 0.9rem 'Inter', sans-serif"); // Adjust font to match CSS

  // 2. Measure Visible Rows (Current Page)
  // We scan visible rows (paginatedRows) to keep performance high
  const rowsToCheck = paginatedRows.value || [];
  const colIndex = props.columns.indexOf(columnKey);

  if (colIndex !== -1) {
    rowsToCheck.forEach((row) => {
      const cellValue = row[colIndex];
      const formatted = formatCell(cellValue, columnKey);
      const w = getTextWidth(formatted, "400 0.9rem 'Inter', sans-serif");
      if (w > maxWidth) maxWidth = w;
    });
  }

  // 3. Add Padding (Cell padding is 16px left + 16px right = 32px. Add buffer)
  const padding = 40;

  // 4. Set Width (Cap at 500px to avoid massive columns)
  columnWidths[columnKey] = Math.min(Math.max(maxWidth + padding, 100), 500);
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
  // Cleanup listeners just in case
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});

// === EXPORT LOGIC ===
function getExportData() {
  // Gunakan fungsi dari composable Anda untuk mendapatkan semua baris yang cocok dengan filter
  const filteredRows = getFilteredRows(
    props.messageIndex,
    props.rows,
    props.columns,
    formatCell
  );

  // 1. Buat Headers (memakai formatHeader Anda)
  const headers = props.columns.map((col) => formatHeader(col));

  // 2. Buat Body (memakai formatCell Anda)
  const body = filteredRows.map((rowArray) => {
    return rowArray.map((cellValue, cIndex) => {
      // Format setiap sel persis seperti yang terlihat di tabel
      return formatCell(cellValue, props.columns[cIndex]);
    });
  });

  return { headers, body };
}

/**
 * Memicu unduhan file PDF
 */
async function exportToPDF() {
  try {
    const { headers, body } = getExportData();

    const doc = new jsPDF({
      orientation: "landscape",
    });

    const tableOptions = {
      head: [headers],
      body: body,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
    };

    // Try to use autoTable attached to the doc first, otherwise dynamic import the plugin
    if (typeof doc.autoTable === "function") {
      doc.autoTable(tableOptions);
    } else {
      // dynamic import as fallback (works with ESM builds)
      const at = await import("jspdf-autotable");
      // plugin may export default function or attach autoTable to doc
      if (at && typeof at.default === "function") {
        // some versions accept (doc, options)
        try {
          at.default(doc, tableOptions);
        } catch (e) {
          // fallback to calling resulting autoTable on doc if attached
          if (typeof doc.autoTable === "function") doc.autoTable(tableOptions);
          else throw e;
        }
      } else if (typeof doc.autoTable === "function") {
        doc.autoTable(tableOptions);
      } else {
        throw new Error("jspdf-autotable plugin not available");
      }
    }

    doc.text("Laporan Data", 14, 15);
    doc.save("export_data.pdf");
  } catch (err) {
    console.error("exportToPDF error:", err);
    try {
      alert(
        "Gagal mengekspor PDF: " +
          (err && err.message ? err.message : String(err))
      );
    } catch (e) {}
  }
}

// Export using pdfmake (PDF v2)
async function exportToPDFv2() {
  try {
    const { headers, body } = getExportData();

    // dynamic import pdfmake to avoid bundling issues
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFonts = await import("pdfmake/build/vfs_fonts");

    const pdfMake =
      pdfMakeModule && pdfMakeModule.default
        ? pdfMakeModule.default
        : pdfMakeModule;

    if (pdfFonts && (pdfFonts.pdfMake || pdfFonts.vfs)) {
      // set vfs depending on export shape
      if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs)
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      else if (pdfFonts.vfs) pdfMake.vfs = pdfFonts.vfs;
    }

    // build table body for pdfmake: include header row
    const tableBody = [headers, ...body];

    const dd = {
      content: [
        { text: "Laporan Data", style: "header" },
        { text: "\n" },
        {
          style: "tableExample",
          table: {
            headerRows: 1,
            body: tableBody,
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
        tableExample: { margin: [0, 5, 0, 15] },
        tableHeader: { bold: true, fontSize: 11, color: "black" },
      },
      defaultStyle: { fontSize: 9 },
    };

    pdfMake.createPdf(dd).download("export_data_v2.pdf");
  } catch (err) {
    console.error("exportToPDFv2 error:", err);
    try {
      alert(
        "Gagal mengekspor PDF v2: " +
          (err && err.message ? err.message : String(err))
      );
    } catch (e) {}
  }
}

function exportToCSV() {
  const { headers, body } = getExportData();

  // Gabungkan header
  let csvContent = headers.join(",") + "\n";

  // Gabungkan body
  body.forEach((row) => {
    // Pastikan nilai yang mengandung koma dibungkus tanda kutip
    const escapedRow = row.map(
      (cell) => `"${String(cell).replace(/"/g, '""')}"`
    );
    csvContent += escapedRow.join(",") + "\n";
  });

  // Buat Blob dan picu download
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "export_data.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  width: fit-content; /* Allow table to grow beyond container */
  min-width: 100%; /* Ensure it fills at least the container */
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  table-layout: fixed; /* Fixed layout for predictable resizing */
}

/* Resizable Header Th */
.resizable-th {
  position: relative;
  /* Default width handling is now via inline style, but set min-width to prevent squashing */
  min-width: 150px;
  background-clip: padding-box; /* Prevents background from covering border */
}

.header-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 18px; /* Room for handle */
}

/* RESIZE HANDLE */
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 20; /* Above header content */
  user-select: none;
}

.resize-handle:hover,
.resizable-th:hover .resize-handle {
  background-color: rgba(66, 153, 225, 0.5); /* Show on hover */
}

/* Active resizing state */
.resize-handle:active {
  background-color: var(--primary-blue);
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);

  /* Text overflow handling */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  vertical-align: middle;
  box-sizing: border-box; /* Important for width calculations */
}

.data-table th {
  background-color: var(--bubble-bot-bg);
  color: var(--text-light);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  border-right: 1px solid rgba(255, 255, 255, 0.05); /* Sepatator */
}

.data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  cursor: default;
}

/* Specific column width adjustments */
.data-table th:first-child,
.data-table td:first-child {
  /* This is just a default default */
}

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

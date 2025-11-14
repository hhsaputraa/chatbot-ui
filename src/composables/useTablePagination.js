/**
 * Composable for table pagination logic
 * Manages pagination state, search/filter, and jump to page functionality
 */
import { ref } from "vue"

export function useTablePagination() {
  // Pagination state: Map of message index to pagination settings
  const paginationState = ref({})
  
  // Search/filter state: Map of message index to search query
  const searchState = ref({})
  
  // Jump to page state: Map of message index to jump input value
  const jumpToPageInput = ref({})

  /**
   * Initialize search state for a table
   * @param {number} messageIndex - Index of the message/table
   */
  function initSearch(messageIndex) {
    if (!searchState.value[messageIndex]) {
      searchState.value[messageIndex] = ""
    }
  }

  /**
   * Filter rows based on search query
   * @param {number} messageIndex - Index of the message/table
   * @param {Array} allRows - All rows in the table
   * @param {Array} columns - Column names
   * @param {Function} formatCell - Function to format cell values
   * @returns {Array} - Filtered rows
   */
  function getFilteredRows(messageIndex, allRows, columns, formatCell) {
    const searchQuery = searchState.value[messageIndex]
    if (!searchQuery || searchQuery.trim() === "") {
      return allRows
    }

    const query = searchQuery.toLowerCase().trim()
    return allRows.filter(row => {
      // Search across all columns
      return row.some((cellValue, colIndex) => {
        const formattedValue = formatCell(cellValue, columns[colIndex])
        return String(formattedValue).toLowerCase().includes(query)
      })
    })
  }

  /**
   * Update search query and reset to first page
   * @param {number} messageIndex - Index of the message/table
   * @param {string} query - Search query
   */
  function updateSearch(messageIndex, query) {
    searchState.value[messageIndex] = query
    // Reset to first page when search changes
    if (paginationState.value[messageIndex]) {
      paginationState.value[messageIndex].currentPage = 1
    }
  }

  /**
   * Clear search and reset to first page
   * @param {number} messageIndex - Index of the message/table
   */
  function clearSearch(messageIndex) {
    searchState.value[messageIndex] = ""
    // Reset to first page when search is cleared
    if (paginationState.value[messageIndex]) {
      paginationState.value[messageIndex].currentPage = 1
    }
  }

  /**
   * Initialize pagination for a table
   * @param {number} messageIndex - Index of the message/table
   * @param {number} totalRows - Total number of rows
   */
  function initPagination(messageIndex, totalRows) {
    if (!paginationState.value[messageIndex]) {
      paginationState.value[messageIndex] = {
        currentPage: 1,
        rowsPerPage: 10,
      }
    }
    // Also initialize search state
    initSearch(messageIndex)
    // Initialize jump to page input
    if (!jumpToPageInput.value[messageIndex]) {
      jumpToPageInput.value[messageIndex] = ""
    }
  }

  /**
   * Get paginated rows (after filtering)
   * @param {number} messageIndex - Index of the message/table
   * @param {Array} allRows - All rows in the table
   * @param {Array} columns - Column names
   * @param {Function} formatCell - Function to format cell values
   * @returns {Array} - Paginated rows
   */
  function getPaginatedRows(messageIndex, allRows, columns, formatCell) {
    // First apply search filter
    const filteredRows = getFilteredRows(messageIndex, allRows, columns, formatCell)
    
    const state = paginationState.value[messageIndex]
    if (!state) return filteredRows

    const start = (state.currentPage - 1) * state.rowsPerPage
    const end = start + state.rowsPerPage
    return filteredRows.slice(start, end)
  }

  /**
   * Get total number of pages
   * @param {number} messageIndex - Index of the message/table
   * @param {number} totalRows - Total number of rows (filtered)
   * @returns {number} - Total pages
   */
  function getTotalPages(messageIndex, totalRows) {
    const state = paginationState.value[messageIndex]
    if (!state) return 1
    return Math.ceil(totalRows / state.rowsPerPage)
  }

  /**
   * Get count of filtered rows
   * @param {number} messageIndex - Index of the message/table
   * @param {Array} allRows - All rows in the table
   * @param {Array} columns - Column names
   * @param {Function} formatCell - Function to format cell values
   * @returns {number} - Count of filtered rows
   */
  function getFilteredRowCount(messageIndex, allRows, columns, formatCell) {
    return getFilteredRows(messageIndex, allRows, columns, formatCell).length
  }

  /**
   * Navigate to a specific page
   * @param {number} messageIndex - Index of the message/table
   * @param {number} page - Page number to navigate to
   */
  function goToPage(messageIndex, page) {
    const state = paginationState.value[messageIndex]
    if (state) {
      state.currentPage = page
    }
  }

  /**
   * Change rows per page and reset to first page
   * @param {number} messageIndex - Index of the message/table
   * @param {number} newRowsPerPage - New rows per page value
   */
  function changeRowsPerPage(messageIndex, newRowsPerPage) {
    const state = paginationState.value[messageIndex]
    if (state) {
      state.rowsPerPage = newRowsPerPage
      state.currentPage = 1 // Reset to first page
    }
  }

  return {
    paginationState,
    searchState,
    jumpToPageInput,
    initSearch,
    getFilteredRows,
    updateSearch,
    clearSearch,
    initPagination,
    getPaginatedRows,
    getTotalPages,
    getFilteredRowCount,
    goToPage,
    changeRowsPerPage,
  }
}


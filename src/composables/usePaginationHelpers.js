/**
 * Composable for pagination UI helper functions
 * Handles page number display logic and jump to page functionality
 */

export function usePaginationHelpers() {
  /**
   * Determine if a page number should be shown
   * @param {number} pageNum - Page number to check
   * @param {number} currentPage - Current active page
   * @param {number} totalPages - Total number of pages
   * @returns {boolean} - Whether to show the page number
   */
  function shouldShowPageNumber(pageNum, currentPage, totalPages) {
    // Always show first and last page
    if (pageNum === 1 || pageNum === totalPages) return true
    // Show current page and adjacent pages
    if (Math.abs(pageNum - currentPage) <= 1) return true
    return false
  }

  /**
   * Determine if ellipsis should be shown
   * @param {number} pageNum - Page number to check
   * @param {number} currentPage - Current active page
   * @param {number} totalPages - Total number of pages
   * @returns {boolean} - Whether to show ellipsis
   */
  function shouldShowEllipsis(pageNum, currentPage, totalPages) {
    // Show ellipsis after page 1 if current page is far from start
    if (pageNum === 2 && currentPage > 3) return true
    // Show ellipsis before last page if current page is far from end
    if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return true
    return false
  }

  /**
   * Handle jump to page functionality
   * @param {number} messageIndex - Index of the message/table
   * @param {string} inputValue - Input value from jump to page field
   * @param {number} totalPages - Total number of pages
   * @param {Function} goToPage - Function to navigate to a page
   * @param {Function} clearInput - Function to clear the input
   * @returns {boolean} - Whether the jump was successful
   */
  function handleJumpToPage(messageIndex, inputValue, totalPages, goToPage, clearInput) {
    const pageNum = parseInt(inputValue)
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      // Invalid page number
      return false
    }
    
    goToPage(messageIndex, pageNum)
    clearInput(messageIndex)
    return true
  }

  /**
   * Update jump to page input value
   * @param {Object} jumpToPageInput - Ref object containing input values
   * @param {number} messageIndex - Index of the message/table
   * @param {string} value - New input value
   */
  function updateJumpToPageInput(jumpToPageInput, messageIndex, value) {
    jumpToPageInput.value[messageIndex] = value
  }

  /**
   * Clear jump to page input
   * @param {Object} jumpToPageInput - Ref object containing input values
   * @param {number} messageIndex - Index of the message/table
   */
  function clearJumpToPageInput(jumpToPageInput, messageIndex) {
    jumpToPageInput.value[messageIndex] = ""
  }

  return {
    shouldShowPageNumber,
    shouldShowEllipsis,
    handleJumpToPage,
    updateJumpToPageInput,
    clearJumpToPageInput,
  }
}


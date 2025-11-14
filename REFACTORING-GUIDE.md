# Chatbot UI Refactoring Guide

## Overview

This document describes the refactoring performed on the chatbot UI application to improve code organization, maintainability, and reusability. The original monolithic `App.vue` file (1640+ lines) has been split into modular components and composables.

## Refactoring Summary

### Before Refactoring
- **Single file**: `src/App.vue` (~1640 lines)
- All logic, UI, and styles in one file
- Difficult to maintain and test
- Code duplication
- Poor separation of concerns

### After Refactoring
- **Main App**: `src/App.vue` (~497 lines)
- **4 Reusable Components**: Separated UI concerns
- **3 Composables**: Shared business logic
- **Better organization**: Clear separation of concerns
- **Easier testing**: Isolated, testable units
- **Improved maintainability**: Smaller, focused files

---

## New File Structure

```
src/
├── App.vue                          # Main application (refactored)
├── App-original-backup.vue          # Original backup
├── App-refactored.vue               # Refactored version (same as App.vue)
├── components/
│   ├── ChatMessage.vue              # Message rendering component
│   ├── DataTable.vue                # Table with search & pagination
│   ├── PaginationControls.vue       # Pagination UI controls
│   └── SearchBar.vue                # Search/filter input
└── composables/
    ├── useFormatting.js             # Data formatting utilities
    ├── useTablePagination.js        # Pagination & search logic
    └── usePaginationHelpers.js      # Pagination UI helpers
```

---

## Components

### 1. **ChatMessage.vue**
**Purpose**: Renders individual chat messages (user, bot, error, data)

**Props**:
- `message` (Object): Message data
- `messageIndex` (Number): Index in messages array

**Features**:
- Displays text, error, and data messages
- Handles avatars for user and bot
- Integrates DataTable for data messages
- Scoped styles for message blocks

**Usage**:
```vue
<ChatMessage
  :message="message"
  :message-index="index"
/>
```

---

### 2. **DataTable.vue**
**Purpose**: Displays tabular data with search, filter, and pagination

**Props**:
- `messageIndex` (Number): Table identifier
- `rows` (Array): Table data rows
- `columns` (Array): Column names

**Features**:
- Integrated SearchBar component
- Integrated PaginationControls component
- Filtered and paginated data display
- "No results" message
- Independent state per table

**Usage**:
```vue
<DataTable
  :message-index="0"
  :rows="tableData.rows"
  :columns="tableData.columns"
/>
```

---

### 3. **SearchBar.vue**
**Purpose**: Search/filter input with clear button

**Props**:
- `searchQuery` (String): Current search query
- `filteredCount` (Number): Filtered results count
- `totalCount` (Number): Total rows count

**Emits**:
- `update:searchQuery`: Search query changed
- `clear`: Clear search button clicked

**Features**:
- Real-time search input
- Clear button (X icon)
- Result counter display
- Search icon
- Scoped styles

**Usage**:
```vue
<SearchBar
  :search-query="query"
  :filtered-count="15"
  :total-count="100"
  @update:search-query="handleSearch"
  @clear="handleClear"
/>
```

---

### 4. **PaginationControls.vue**
**Purpose**: Pagination UI with page navigation and jump-to-page

**Props**:
- `currentPage` (Number): Current active page
- `totalPages` (Number): Total number of pages
- `rowsPerPage` (Number): Rows per page
- `jumpToPageValue` (String): Jump input value

**Emits**:
- `update:rowsPerPage`: Rows per page changed
- `goToPage`: Navigate to specific page
- `update:jumpToPageValue`: Jump input changed
- `jumpToPage`: Jump button clicked

**Features**:
- Previous/Next buttons
- Page number buttons with ellipsis
- Rows per page selector
- Jump to page input
- Disabled states
- Scoped styles

**Usage**:
```vue
<PaginationControls
  :current-page="1"
  :total-pages="10"
  :rows-per-page="10"
  :jump-to-page-value="jumpValue"
  @update:rows-per-page="handleRowsChange"
  @go-to-page="handlePageChange"
  @jump-to-page="handleJump"
/>
```

---

## Composables

### 1. **useFormatting.js**
**Purpose**: Data formatting utilities

**Exports**:
- `formatter`: Intl.NumberFormat for IDR currency
- `getColumnType(colName)`: Determine column type
- `formatCell(value, colName)`: Format cell value
- `formatHeader(headerKey)`: Format column header

**Usage**:
```javascript
import { useFormatting } from '@/composables/useFormatting'

const { formatCell, formatHeader } = useFormatting()
const formatted = formatCell(50000, 'saldo') // "Rp 50.000"
```

---

### 2. **useTablePagination.js**
**Purpose**: Pagination and search state management

**Exports**:
- `paginationState`: Ref object for pagination state
- `searchState`: Ref object for search queries
- `jumpToPageInput`: Ref object for jump inputs
- `initPagination(index, totalRows)`: Initialize pagination
- `getPaginatedRows(index, rows, columns, formatCell)`: Get paginated rows
- `getFilteredRows(index, rows, columns, formatCell)`: Filter rows
- `getFilteredRowCount(index, rows, columns, formatCell)`: Count filtered rows
- `getTotalPages(index, totalRows)`: Calculate total pages
- `goToPage(index, page)`: Navigate to page
- `changeRowsPerPage(index, newValue)`: Change rows per page
- `updateSearch(index, query)`: Update search query
- `clearSearch(index)`: Clear search

**Usage**:
```javascript
import { useTablePagination } from '@/composables/useTablePagination'

const {
  initPagination,
  getPaginatedRows,
  goToPage
} = useTablePagination()

initPagination(0, 100)
const rows = getPaginatedRows(0, allRows, columns, formatCell)
```

---

### 3. **usePaginationHelpers.js**
**Purpose**: Pagination UI helper functions

**Exports**:
- `shouldShowPageNumber(pageNum, currentPage, totalPages)`: Check if page number should display
- `shouldShowEllipsis(pageNum, currentPage, totalPages)`: Check if ellipsis should display
- `handleJumpToPage(index, inputValue, totalPages, goToPage, clearInput)`: Handle jump to page
- `updateJumpToPageInput(jumpToPageInput, index, value)`: Update jump input
- `clearJumpToPageInput(jumpToPageInput, index)`: Clear jump input

**Usage**:
```javascript
import { usePaginationHelpers } from '@/composables/usePaginationHelpers'

const { shouldShowPageNumber, handleJumpToPage } = usePaginationHelpers()

if (shouldShowPageNumber(5, 3, 10)) {
  // Show page 5 button
}
```

---

## Benefits of Refactoring

### 1. **Improved Maintainability**
- Smaller, focused files (< 350 lines each)
- Clear separation of concerns
- Easier to locate and fix bugs

### 2. **Better Reusability**
- Components can be reused in other projects
- Composables provide shared logic
- DRY principle applied

### 3. **Enhanced Testability**
- Isolated components easier to unit test
- Composables can be tested independently
- Props and emits clearly defined

### 4. **Improved Developer Experience**
- Easier onboarding for new developers
- Better code navigation
- Clear component responsibilities

### 5. **Performance**
- No performance impact (same functionality)
- Potential for future optimizations
- Better tree-shaking opportunities

---

## Migration Notes

### Original File Backup
The original `App.vue` has been backed up to `src/App-original-backup.vue`

### No Breaking Changes
- All functionality preserved
- Same API endpoints
- Same user experience
- Same styling and theme

### Testing Checklist
- ✅ Chat interface loads correctly
- ✅ Messages display properly (user, bot, error)
- ✅ Tables render with data
- ✅ Search/filter works across all columns
- ✅ Pagination controls function correctly
- ✅ Jump to page validates input
- ✅ Multiple tables maintain independent state
- ✅ Currency and datetime formatting preserved
- ✅ Mobile responsiveness maintained
- ✅ Dark theme styling intact

---

## Future Improvements

### Potential Enhancements
1. **TypeScript**: Add type safety
2. **Unit Tests**: Add Vitest tests for components
3. **Storybook**: Component documentation
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Internationalization**: i18n support
6. **State Management**: Pinia for complex state
7. **API Layer**: Separate API calls into services
8. **Error Boundaries**: Better error handling

---

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Conclusion

This refactoring significantly improves the codebase organization while maintaining 100% feature parity. The modular structure makes the application easier to maintain, test, and extend in the future.


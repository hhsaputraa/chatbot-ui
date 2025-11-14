# Component Architecture

## Component Hierarchy

```
App.vue (Main Application)
│
├── Sidebar
│   └── New Chat Button
│
└── Main Chat Area
    ├── Welcome Card (conditional)
    │   └── Suggestion Buttons
    │
    ├── ChatMessage (v-for messages)
    │   ├── Avatar (User/Bot)
    │   └── Message Content
    │       ├── Text Message
    │       ├── Error Message
    │       └── Data Message
    │           └── DataTable
    │               ├── SearchBar
    │               │   ├── Search Input
    │               │   ├── Clear Button
    │               │   └── Results Info
    │               ├── Table
    │               │   ├── Table Header
    │               │   └── Table Body (paginated rows)
    │               ├── No Results Message (conditional)
    │               └── PaginationControls
    │                   ├── Rows Per Page Selector
    │                   ├── Page Info
    │                   ├── Previous Button
    │                   ├── Page Numbers
    │                   ├── Jump to Page
    │                   │   ├── Page Input
    │                   │   └── Go Button
    │                   └── Next Button
    │
    ├── Loading Indicator (conditional)
    │
    └── Chat Input Form
        ├── Text Input
        └── Send Button
```

---

## Data Flow

### 1. **Message Rendering Flow**
```
App.vue
  ↓ (messages array)
ChatMessage
  ↓ (message.data)
DataTable
  ↓ (rows, columns)
SearchBar + Table + PaginationControls
```

### 2. **Search Flow**
```
User types in SearchBar
  ↓ (emit update:searchQuery)
DataTable (handleSearchUpdate)
  ↓ (updateSearch from composable)
useTablePagination (searchState updated)
  ↓ (reactive update)
getPaginatedRows (filters then paginates)
  ↓ (computed property)
Table re-renders with filtered data
```

### 3. **Pagination Flow**
```
User clicks page number
  ↓ (emit goToPage)
DataTable (handleGoToPage)
  ↓ (goToPage from composable)
useTablePagination (paginationState updated)
  ↓ (reactive update)
getPaginatedRows (returns new page)
  ↓ (computed property)
Table re-renders with new page
```

### 4. **Jump to Page Flow**
```
User enters page number and clicks Go
  ↓ (emit jumpToPage)
DataTable (handleJumpToPage)
  ↓ (jumpToPageHelper from composable)
usePaginationHelpers (validates input)
  ↓ (if valid)
goToPage (navigates to page)
  ↓ (reactive update)
Table re-renders + input cleared
```

---

## State Management

### App.vue State
```javascript
messages: ref([])           // Chat messages array
userInput: ref("")          // Current input text
isLoading: ref(false)       // Loading state
chatContainer: ref(null)    // Chat scroll container
```

### useTablePagination State (Shared)
```javascript
paginationState: ref({})    // { [messageIndex]: { currentPage, rowsPerPage } }
searchState: ref({})        // { [messageIndex]: "search query" }
jumpToPageInput: ref({})    // { [messageIndex]: "page number" }
```

**Key Design**: Each table maintains independent state using `messageIndex` as the key.

---

## Props & Emits

### ChatMessage
**Props**:
- `message: Object` - Message data
- `messageIndex: Number` - Message index

**Emits**: None (leaf component for message display)

---

### DataTable
**Props**:
- `messageIndex: Number` - Table identifier
- `rows: Array` - Table data
- `columns: Array` - Column names

**Emits**: None (manages internal state via composables)

**Internal Events**:
- Handles search updates
- Handles pagination changes
- Handles jump to page

---

### SearchBar
**Props**:
- `searchQuery: String` - Current search
- `filteredCount: Number` - Filtered count
- `totalCount: Number` - Total count

**Emits**:
- `update:searchQuery` - Search changed
- `clear` - Clear button clicked

---

### PaginationControls
**Props**:
- `currentPage: Number` - Current page
- `totalPages: Number` - Total pages
- `rowsPerPage: Number` - Rows per page
- `jumpToPageValue: String` - Jump input

**Emits**:
- `update:rowsPerPage` - Rows per page changed
- `goToPage` - Page navigation
- `update:jumpToPageValue` - Jump input changed
- `jumpToPage` - Jump button clicked

---

## Composable Functions

### useFormatting
**Pure functions** - No state
- Format currency (IDR)
- Format datetime
- Format headers
- Determine column types

### useTablePagination
**Stateful** - Manages pagination & search
- Initialize pagination
- Filter rows by search
- Paginate filtered rows
- Navigate pages
- Change rows per page

### usePaginationHelpers
**Pure functions** - UI helpers
- Determine page number visibility
- Determine ellipsis visibility
- Handle jump to page validation

---

## Styling Strategy

### Global Styles (App.vue)
- CSS variables (theme colors)
- Global resets
- Layout styles
- Responsive breakpoints

### Scoped Styles (Components)
- Component-specific styles
- Use CSS variables for consistency
- No style leakage between components

### CSS Variables
```css
--bg-dark: #121212
--bg-darker: #0f0f0f
--text-light: #ffffff
--text-muted: #8e8ea0
--border-color: #3e3e40
--primary-blue: #4299e1
--input-bg: #2d2d2d
--bubble-bot-bg: #2a2a2a
--bubble-user-bg: #2c2c2c
```

---

## Reactivity Model

### Computed Properties
```javascript
// DataTable.vue
const searchQuery = computed(() => searchState.value[props.messageIndex] || "")
const filteredCount = computed(() => getFilteredRowCount(...))
const paginatedRows = computed(() => getPaginatedRows(...))
const totalPages = computed(() => getTotalPages(...))
```

**Benefits**:
- Automatic updates when dependencies change
- Cached until dependencies change
- Clean, declarative code

### Reactive State
```javascript
// useTablePagination.js
const paginationState = ref({})
const searchState = ref({})

// Updates trigger re-renders
paginationState.value[index].currentPage = 2
searchState.value[index] = "search term"
```

---

## Performance Considerations

### 1. **Computed Properties**
- Cached results
- Only recalculate when dependencies change
- Efficient for filtered/paginated data

### 2. **Component Splitting**
- Smaller components = faster re-renders
- Only affected components update
- Better Vue DevTools performance

### 3. **Scoped Styles**
- CSS scoping via Vue SFC
- No global style pollution
- Better CSS performance

### 4. **Independent State**
- Each table has own state
- No unnecessary re-renders
- Scales well with multiple tables

---

## Testing Strategy

### Unit Tests (Recommended)
```javascript
// Example: SearchBar.test.js
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

test('emits update:searchQuery on input', async () => {
  const wrapper = mount(SearchBar, {
    props: { searchQuery: '', filteredCount: 10, totalCount: 100 }
  })
  
  await wrapper.find('.search-input').setValue('test')
  expect(wrapper.emitted('update:searchQuery')).toBeTruthy()
})
```

### Integration Tests
- Test DataTable with SearchBar + PaginationControls
- Test ChatMessage with different message types
- Test App.vue with full message flow

### E2E Tests
- Test complete user workflows
- Test API integration
- Test responsive behavior

---

## Accessibility

### Current Implementation
- Semantic HTML elements
- ARIA labels on chat history
- Keyboard navigation (form submit)
- Focus states on inputs/buttons

### Future Improvements
- ARIA live regions for messages
- Keyboard navigation for pagination
- Screen reader announcements
- Focus management
- High contrast mode support

---

## Browser Compatibility

### Supported Browsers
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Polyfills Needed
- None (modern browsers only)
- Intl.NumberFormat (built-in)
- CSS Grid/Flexbox (native support)

---

## Deployment Considerations

### Build Output
```bash
npm run build
# Outputs to dist/
```

### Environment Variables
- API endpoint: `http://localhost:8080/api/query`
- Consider using `.env` files for different environments

### Production Optimizations
- Vite automatically:
  - Minifies code
  - Tree-shakes unused code
  - Optimizes assets
  - Generates source maps

---

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Maintainable codebase
- ✅ Scalable structure
- ✅ Type-safe potential (TypeScript ready)
- ✅ Test-friendly design


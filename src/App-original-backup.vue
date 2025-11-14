<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue"

const messages = ref([])
const userInput = ref("")
const isLoading = ref(false)
const chatContainer = ref(null)

// Pagination state: Map of message index to pagination settings
const paginationState = ref({})

// Search/filter state: Map of message index to search query
const searchState = ref({})

// Jump to page state: Map of message index to jump input value
const jumpToPageInput = ref({})

onMounted(() => {
  startNewChat()
})

function startNewChat() {
  messages.value = []
  nextTick(() => {
    messages.value.push({
      role: "bot",
      type: "text",
      content:
        "Halo! Saya adalah AI asisten bank. Apa yang ingin Anda ketahui?",
    })
  })
}

function getColumnType(colName) {
  const name = colName.toLowerCase()

  // 1️⃣ uang (IDR) → nama kolom yang memang berkaitan dengan saldo/transaksi
  if (
    name.includes("saldo") ||
    name.includes("debit") ||
    name.includes("kredit")
  ) {
    return "currency"
  }

  // 2️⃣ tanggal / waktu → diformat sebagai tanggal
  if (name.includes("tanggal") || name.includes("waktu")) {
    return "datetime"
  }

  // 3️⃣ kolom khusus "jumlah_nasabah" → tidak pakai format uang
  if (name === "jumlah_nasabah") {
    return "number"
  }

  // 4️⃣ sisanya = teks biasa
  return "text"
}

function formatCell(value, colName) {
  const type = getColumnType(colName)
  if (type === "currency") {
    return formatter.format(parseFloat(value) || 0)
  }
  if (type === "datetime") {
    const d = new Date(value)
    return isNaN(d)
      ? value
      : d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
  }
  // type === 'number' atau 'text' → tampil apa adanya
  return value
}

async function handleSubmit() {
  if (!userInput.value.trim()) return
  isLoading.value = true
  const currentMessage = userInput.value

  messages.value.push({ role: "user", type: "text", content: currentMessage })
  userInput.value = ""

  const requestPayload = { prompt: currentMessage }

  try {
    const response = await fetch("http://localhost:8080/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Terjadi kesalahan dari API")
    }
    const messageIndex = messages.value.length
    messages.value.push({ role: "bot", type: "data", data: data })

    // Initialize pagination for this message
    if (data.rows && data.rows.length > 0) {
      initPagination(messageIndex, data.rows.length)
    }
  } catch (error) {
    let errorMsg = error.message
    if (error.message.includes("Failed to fetch")) {
      errorMsg =
        "Gagal terhubung ke backend (http://localhost:8080). Pastikan backend Go kamu sudah jalan!"
    }
    messages.value.push({ role: "bot", type: "error", content: errorMsg })
  }
  isLoading.value = false
}

const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

// 4.1 Ekstrak formatter ke computed property
const formattedValue = (value, type) => {
  if (type.includes("saldo") || type.includes("jumlah")) {
    return formatter.format(parseFloat(value) || 0)
  }
  if (type.includes("tanggal") || type.includes("waktu")) {
    return new Date(value).toLocaleString("id-ID")
  }
  return value
}

// 4.2 Tambah input validation
function validateInput(input) {
  return input.trim().length > 0
}

// Search/filter helper functions
function initSearch(messageIndex) {
  if (!searchState.value[messageIndex]) {
    searchState.value[messageIndex] = ""
  }
}

function getFilteredRows(messageIndex, allRows, columns) {
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

function updateSearch(messageIndex, query) {
  searchState.value[messageIndex] = query
  // Reset to first page when search changes
  if (paginationState.value[messageIndex]) {
    paginationState.value[messageIndex].currentPage = 1
  }
}

function clearSearch(messageIndex) {
  searchState.value[messageIndex] = ""
  // Reset to first page when search is cleared
  if (paginationState.value[messageIndex]) {
    paginationState.value[messageIndex].currentPage = 1
  }
}

// Pagination helper functions
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

function getPaginatedRows(messageIndex, allRows, columns) {
  // First apply search filter
  const filteredRows = getFilteredRows(messageIndex, allRows, columns)

  const state = paginationState.value[messageIndex]
  if (!state) return filteredRows

  const start = (state.currentPage - 1) * state.rowsPerPage
  const end = start + state.rowsPerPage
  return filteredRows.slice(start, end)
}

function getTotalPages(messageIndex, totalRows) {
  const state = paginationState.value[messageIndex]
  if (!state) return 1
  return Math.ceil(totalRows / state.rowsPerPage)
}

function getFilteredRowCount(messageIndex, allRows, columns) {
  return getFilteredRows(messageIndex, allRows, columns).length
}

function goToPage(messageIndex, page) {
  const state = paginationState.value[messageIndex]
  if (state) {
    state.currentPage = page
  }
}

function changeRowsPerPage(messageIndex, newRowsPerPage) {
  const state = paginationState.value[messageIndex]
  if (state) {
    state.rowsPerPage = newRowsPerPage
    state.currentPage = 1 // Reset to first page
  }
}

// Helper function to determine which page numbers to show
function shouldShowPageNumber(pageNum, currentPage, totalPages) {
  // Always show first page, last page, current page, and pages around current
  if (pageNum === 1 || pageNum === totalPages) return true
  if (Math.abs(pageNum - currentPage) <= 1) return true
  return false
}

// Helper function to determine where to show ellipsis
function shouldShowEllipsis(pageNum, currentPage, totalPages) {
  // Show ellipsis after page 1 if current page is far from start
  if (pageNum === 2 && currentPage > 3) return true
  // Show ellipsis before last page if current page is far from end
  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return true
  return false
}

// Jump to page functions
function handleJumpToPage(messageIndex, allRows, columns) {
  const inputValue = jumpToPageInput.value[messageIndex]
  const pageNum = parseInt(inputValue)

  // Get filtered row count for accurate total pages
  const filteredCount = getFilteredRowCount(messageIndex, allRows, columns)
  const totalPages = getTotalPages(messageIndex, filteredCount)

  if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
    // Invalid page number - could show error message
    return false
  }

  goToPage(messageIndex, pageNum)
  jumpToPageInput.value[messageIndex] = "" // Clear input after successful jump
  return true
}

function updateJumpToPageInput(messageIndex, value) {
  jumpToPageInput.value[messageIndex] = value
}

watch(
  () => messages.value.length, // hanya watch length
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
)
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="startNewChat">
          <svg
            class="icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Chat
        </button>
      </div>
    </aside>

    <main class="chat-main">
      <div
        class="chat-history"
        ref="chatContainer"
        aria-live="polite"
        aria-label="Chat history"
      >
        <div v-if="messages.length === 1" class="welcome-card">
          <h2>Halo, saya asisten bank Anda 🤖</h2>
          <p>
            Tanyakan apa saja tentang rekening, transaksi, saldo, atau nasabah.
          </p>
          <div class="suggestions">
            <span
              @click="
                userInput =
                  'Tampilkan semua nasabah dengan saldo lebih dari 10 juta'
              "
              class="suggestion"
              >Saldo > 10 juta</span
            >
            <span
              @click="userInput = 'Tampilkan transaksi terakhir 5 nasabah'"
              class="suggestion"
              >Transaksi terakhir</span
            >
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message-block', message.role]"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <div v-if="message.role === 'user'" class="avatar">
            <div class="avatar-user">👤</div>
          </div>

          <div class="message-content">
            <template v-if="message.type === 'text'">
              {{ message.content }}
            </template>
            <template v-else-if="message.type === 'error'">
              <div class="error-box">
                <svg
                  class="error-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span>{{ message.content }}</span>
              </div>
            </template>
            <template v-else-if="message.type === 'data'">
              <div
                v-if="
                  !message.data ||
                  !message.data.rows ||
                  message.data.rows.length === 0
                "
                class="no-data"
              >
                <svg
                  class="empty-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9.75 14.25 12 12 14.25l-2.25-2.25L12 9.75ZM12 18a2.25 2.25 0 1 0 0-4.5A2.25 2.25 0 0 0 12 18ZM12 2.25V18"
                  />
                </svg>
                <p>Tidak ada data ditemukan.</p>
              </div>
              <div v-else class="table-container">
                <!-- Search/Filter Input -->
                <div class="search-container">
                  <div class="search-input-wrapper">
                    <svg
                      class="search-icon"
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
                    <input
                      type="text"
                      class="search-input"
                      placeholder="Cari..."
                      :value="searchState[index] || ''"
                      @input="updateSearch(index, $event.target.value)"
                    />
                    <button
                      v-if="searchState[index] && searchState[index].length > 0"
                      class="clear-search-btn"
                      @click="clearSearch(index)"
                      title="Clear search"
                    >
                      <svg
                        class="clear-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div class="search-results-info">
                    <span
                      v-if="searchState[index] && searchState[index].length > 0"
                    >
                      Showing
                      {{
                        getFilteredRowCount(
                          index,
                          message.data.rows,
                          message.data.columns
                        )
                      }}
                      of {{ message.data.rows.length }} rows
                    </span>
                  </div>
                </div>

                <!-- Table -->
                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th
                          v-for="headerKey in message.data.columns"
                          :key="headerKey"
                        >
                          {{
                            headerKey
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, c => c.toUpperCase())
                          }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(rowArray, rIndex) in getPaginatedRows(
                          index,
                          message.data.rows,
                          message.data.columns
                        )"
                        :key="rIndex"
                        class="table-row"
                      >
                        <td
                          v-for="(cellValue, cIndex) in rowArray"
                          :key="cIndex"
                        >
                          {{
                            formatCell(cellValue, message.data.columns[cIndex])
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- No Results Message -->
                  <div
                    v-if="
                      getFilteredRowCount(
                        index,
                        message.data.rows,
                        message.data.columns
                      ) === 0 &&
                      searchState[index] &&
                      searchState[index].length > 0
                    "
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
                    <p>No results found for "{{ searchState[index] }}"</p>
                  </div>
                </div>

                <!-- Pagination Controls -->
                <div
                  class="pagination-container"
                  v-if="
                    getFilteredRowCount(
                      index,
                      message.data.rows,
                      message.data.columns
                    ) > 0
                  "
                >
                  <div class="pagination-info">
                    <span>Rows per page:</span>
                    <select
                      class="rows-per-page-select"
                      :value="paginationState[index]?.rowsPerPage || 10"
                      @change="
                        changeRowsPerPage(index, parseInt($event.target.value))
                      "
                    >
                      <option :value="10">10</option>
                      <option :value="20">20</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                    <span class="page-info">
                      Page {{ paginationState[index]?.currentPage || 1 }} of
                      {{
                        getTotalPages(
                          index,
                          getFilteredRowCount(
                            index,
                            message.data.rows,
                            message.data.columns
                          )
                        )
                      }}
                    </span>
                  </div>

                  <div class="pagination-controls">
                    <button
                      class="pagination-btn"
                      :disabled="
                        (paginationState[index]?.currentPage || 1) === 1
                      "
                      @click="
                        goToPage(
                          index,
                          (paginationState[index]?.currentPage || 1) - 1
                        )
                      "
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

                    <div class="page-numbers">
                      <template
                        v-for="pageNum in getTotalPages(
                          index,
                          getFilteredRowCount(
                            index,
                            message.data.rows,
                            message.data.columns
                          )
                        )"
                        :key="pageNum"
                      >
                        <button
                          v-if="
                            shouldShowPageNumber(
                              pageNum,
                              paginationState[index]?.currentPage || 1,
                              getTotalPages(
                                index,
                                getFilteredRowCount(
                                  index,
                                  message.data.rows,
                                  message.data.columns
                                )
                              )
                            )
                          "
                          class="page-number-btn"
                          :class="{
                            active:
                              pageNum ===
                              (paginationState[index]?.currentPage || 1),
                          }"
                          @click="goToPage(index, pageNum)"
                        >
                          {{ pageNum }}
                        </button>
                        <span
                          v-else-if="
                            shouldShowEllipsis(
                              pageNum,
                              paginationState[index]?.currentPage || 1,
                              getTotalPages(
                                index,
                                getFilteredRowCount(
                                  index,
                                  message.data.rows,
                                  message.data.columns
                                )
                              )
                            )
                          "
                          class="page-ellipsis"
                        >
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
                        :max="
                          getTotalPages(
                            index,
                            getFilteredRowCount(
                              index,
                              message.data.rows,
                              message.data.columns
                            )
                          )
                        "
                        :value="jumpToPageInput[index] || ''"
                        @input="
                          updateJumpToPageInput(index, $event.target.value)
                        "
                        @keyup.enter="
                          handleJumpToPage(
                            index,
                            message.data.rows,
                            message.data.columns
                          )
                        "
                      />
                      <button
                        class="jump-btn"
                        @click="
                          handleJumpToPage(
                            index,
                            message.data.rows,
                            message.data.columns
                          )
                        "
                        :disabled="
                          !jumpToPageInput[index] ||
                          jumpToPageInput[index].length === 0
                        "
                      >
                        Go
                      </button>
                    </div>

                    <button
                      class="pagination-btn"
                      :disabled="
                        (paginationState[index]?.currentPage || 1) >=
                        getTotalPages(
                          index,
                          getFilteredRowCount(
                            index,
                            message.data.rows,
                            message.data.columns
                          )
                        )
                      "
                      @click="
                        goToPage(
                          index,
                          (paginationState[index]?.currentPage || 1) + 1
                        )
                      "
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
              </div>
            </template>
          </div>
          <div v-if="message.role === 'bot'" class="avatar">
            <div class="avatar-bot">🤖</div>
          </div>
        </div>

        <div v-if="isLoading" class="message-block bot">
          <div class="avatar"><div class="avatar-bot">🤖</div></div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <form class="chat-input-form" @submit.prevent="handleSubmit">
        <input
          class="chat-input"
          type="text"
          placeholder="silahkan masukan kebutuhan.."
          v-model="userInput"
          :disabled="isLoading"
          autocomplete="off"
        />
        <button type="submit" :disabled="isLoading" class="send-btn">
          <svg
            class="send-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </form>
    </main>
  </div>
</template>

<style>
/* Variabel CSS untuk Warna */
:root {
  --bg-dark: #121212; /* Latar belakang utama */
  --bg-darker: #0f0f0f; /* Latar belakang sidebar */
  --text-light: #ffffff; /* Warna teks umum */
  --text-muted: #8e8ea0; /* Warna teks sekunder/hint */
  --border-color: #3e3e40; /* Warna border */
  --primary-blue: #4299e1; /* Warna utama (biru) */
  --input-bg: #2d2d2d; /* Latar belakang input */
  --bubble-bot-bg: #2a2a2a; /* Latar belakang pesan bot */
  --bubble-user-bg: #2c2c2c; /* Latar belakang pesan user */
  --shadow: rgba(0, 0, 0, 0.5);
}

/* Reset Global */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body,
html,
#app {
  height: 100%;
  width: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  color: var(--text-light);
  background-color: var(--bg-dark);
}

/* Layout Utama */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* --- SIDEBAR --- */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: var(--bg-darker);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  padding: 10px;
}

.sidebar-header {
  padding: 10px;
  margin-bottom: 20px;
}

.new-chat-btn {
  width: 100%;
  padding: 12px 15px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.new-chat-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}
.new-chat-btn .icon {
  width: 20px;
  height: 20px;
  color: var(--text-light);
}

.sidebar-nav {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  color: var(--text-light);
  text-decoration: none;
  font-size: 0.95rem;
  border-radius: 8px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateX(2px);
}
.nav-item .icon {
  width: 20px;
  height: 20px;
  color: var(--text-light);
}

/* --- CHAT MAIN AREA --- */
.chat-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-dark);
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.chat-history::-webkit-scrollbar {
  width: 8px;
}
.chat-history::-webkit-scrollbar-track {
  background: transparent;
}
.chat-history::-webkit-scrollbar-thumb {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

/* Welcome Card */
.welcome-card {
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  padding: 30px;
  border-radius: 12px;
  margin: 20px 20px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.6s ease-out;
}
.welcome-card h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}
.welcome-card p {
  font-size: 0.95rem;
  color: #e0e0e0;
  margin-bottom: 20px;
}
.suggestions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.suggestion {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}
.suggestion:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Message Block */
.message-block {
  display: flex;
  width: 100%;
  padding: 16px 20px;
  gap: 16px;
  align-items: flex-start;
  background-color: var(--bg-dark);
  transition: transform 0.2s ease;
  animation: fadeIn 0.4s ease-out;
  margin-bottom: 16px;
}
.message-block.user {
  flex-direction: row-reverse;
  justify-content: flex-end;
  background-color: var(--bubble-user-bg);
}
.message-block.bot {
  background-color: var(--bubble-bot-bg);
  flex-direction: row-reverse;
  justify-content: flex-start;
}
.message-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background-color: var(--primary-blue);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.avatar-user {
  background-color: #4299e1;
}
.avatar-bot {
  background-color: #6c757d;
}

.message-content {
  flex-grow: 1;
  font-size: 0.95rem;
  line-height: 1.6;
  word-wrap: break-word;
  max-width: calc(100% - 36px - 20px - 40px);
  animation: fadeIn 0.4s ease-out;
}

/* Error Box */
.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #ef4444;
  color: #fca5a5;
}
.error-icon {
  width: 20px;
  height: 20px;
  color: #fca5a5;
}

/* No Data */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  text-align: center;
}
.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.no-data p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Table Container */
.table-container {
  margin-top: 10px;
}

/* Search Container */
.search-container {
  padding: 16px;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.clear-search-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.clear-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.search-results-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-left: 4px;
}

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
  color: var(--text-light);
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
}

.rows-per-page-select:hover {
  border-color: var(--primary-blue);
}

.rows-per-page-select:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.page-info {
  color: var(--text-muted);
  font-size: 0.85rem;
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
  padding: 6px 10px;
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

/* Loader "..." */
.message-content.typing {
  display: flex;
  align-items: center;
  height: 36px;
}
.message-content.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-muted);
  animation: typing 1.4s infinite both;
  display: inline-block;
  margin: 0 2px;
}
.message-content.typing span:nth-child(1) {
  animation-delay: 0.2s;
}
.message-content.typing span:nth-child(2) {
  animation-delay: 0.4s;
}
.message-content.typing span:nth-child(3) {
  animation-delay: 0.6s;
}
@keyframes typing {
  0% {
    opacity: 0.2;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

/* Input Form */
.chat-input-form {
  width: 100%;
  padding: 16px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  background-color: var(--bg-dark);
  border-top: 1px solid var(--border-color);
  position: relative;
}

.chat-input {
  width: 100%;
  max-width: 768px;
  padding: 14px 50px 14px 20px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  background-color: var(--input-bg);
  color: var(--text-light);
  font-size: 1rem;
  resize: none;
  min-height: 50px;
  max-height: 200px;
  overflow-y: auto;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.chat-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.3);
}
.chat-input:disabled {
  background-color: var(--border-color);
  opacity: 0.7;
  cursor: wait;
}

.send-btn {
  position: absolute;
  right: 28px;
  bottom: 22px;
  width: 36px;
  height: 36px;
  background-color: var(--primary-blue);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  overflow: hidden;
}
.send-btn:hover:not(:disabled) {
  background-color: #3182ce;
  transform: scale(1.1);
}
.send-btn:hover:not(:disabled) svg {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}
.send-btn:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
  transform: scale(0.95);
}
.send-btn:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}
.send-icon {
  width: 18px;
  height: 18px;
  color: white;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-content {
  flex-grow: 1;
  max-width: calc(100% - 52px);
}

.message-block.user .message-content {
  text-align: right;
}
.typing-indicator {
  display: flex;
  gap: 5px;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
  animation: pulse 1.4s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    padding: 8px;
  }

  .message-block {
    padding: 12px 16px;
  }

  .data-table {
    font-size: 0.85rem;
  }

  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pagination-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .page-numbers {
    flex-wrap: wrap;
  }

  .pagination-btn {
    font-size: 0.85rem;
    padding: 6px 10px;
  }

  .page-number-btn {
    min-width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .search-container {
    padding: 12px;
  }

  .search-input {
    font-size: 0.85rem;
    padding: 8px 36px 8px 36px;
  }

  .search-icon {
    width: 18px;
    height: 18px;
  }

  .jump-to-page {
    margin-left: 8px;
    padding-left: 8px;
  }

  .jump-to-page-input {
    width: 60px;
    padding: 6px 8px;
    font-size: 0.85rem;
  }

  .jump-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .message-block,
  .welcome-card {
    animation: none;
  }
}
</style>

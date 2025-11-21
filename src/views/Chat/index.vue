<script setup>
import { ref, onMounted, watch, nextTick } from "vue"
import ChatMessage from "../../components/ChatMessage.vue"
import { useTablePagination } from "../../composables/useTablePagination"

const messages = ref([])
const userInput = ref("")
const isLoading = ref(false)
const chatContainer = ref(null)

// Use pagination composable
const { initPagination } = useTablePagination()

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

function handleSuggestionClick(text) {
  userInput.value = text
  handleSubmit()
}

/**
 * Format error message based on backend error codes
 * @param {Object} errorData - Error response from backend
 * @returns {string} - Formatted error message for user
 */
function formatErrorMessage(errorData) {
  const { error_code, message, error_detail } = errorData

  switch (error_code) {
    case "METHOD_NOT_ALLOWED":
      return "Metode HTTP tidak diizinkan. Pastikan menggunakan POST request."

    case "INVALID_JSON":
      return "Format permintaan tidak valid. Silakan coba lagi."

    case "EMPTY_PROMPT":
      return "Pertanyaan tidak boleh kosong. Silakan masukkan pertanyaan Anda."

    case "AI_GENERATION_FAILED":
      return "Sistem AI sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat."

    case "EMPTY_SQL":
      return "AI tidak dapat menghasilkan query yang valid. Silakan perbaiki pertanyaan Anda."

    case "QUERY_EXECUTION_FAILED":
      return `Query tidak dapat dieksekusi. ${
        message || "Silakan perbaiki pertanyaan Anda."
      }`

    default:
      // Fallback to backend message or generic error
      return (
        message || "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi."
      )
  }
}

async function handleSubmit() {
  if (!userInput.value.trim()) return
  isLoading.value = true
  const currentMessage = userInput.value

  messages.value.push({ role: "user", type: "text", content: currentMessage })
  userInput.value = ""

  const requestPayload = { prompt: currentMessage }

  try {
    const response = await fetch("http://localhost:8097/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    })

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      data = {
        status: "error",
        message: "Respons dari server tidak valid",
        error_code: "INVALID_RESPONSE",
      }
    }

    if (data.status === "error") {
      const errorMessage = formatErrorMessage(data)
      messages.value.push({
        role: "bot",
        type: "error",
        content: errorMessage,
        errorCode: data.error_code,
        errorDetail: data.error_detail,
      })
    } else if (data.status === "ambiguous") {
      // Handle ambiguous queries with suggestions
      messages.value.push({
        role: "bot",
        type: "suggestion",
        content: data.message,
        suggestions: data.suggestions,
      })
    } else if (data.status === "success" && data.data && data.data.rows) {
      // Handle successful data response
      const messageIndex = messages.value.length
      messages.value.push({ role: "bot", type: "data", data: data.data })
      if (data.data.rows.length > 0) {
        initPagination(messageIndex, data.data.rows.length)
      }
    } else if (data.status === "success") {
      // Handle successful text response
      messages.value.push({
        role: "bot",
        type: "text",
        content: data.message || "Perintah berhasil dieksekusi.",
      })
    } else {
      // Unknown status
      messages.value.push({
        role: "bot",
        type: "error",
        content: "Respons dari server tidak dikenali.",
      })
    }
  } catch (error) {
    // Handle network errors and other fetch failures
    let errorMsg = "Terjadi kesalahan yang tidak diketahui."

    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      errorMsg =
        "Gagal terhubung ke backend. Pastikan server Go Anda sudah berjalan di http://localhost:8097"
    } else if (error.message.includes("JSON")) {
      errorMsg = "Respons dari server tidak valid. Silakan coba lagi."
    } else if (error.name === "TypeError") {
      errorMsg = "Terjadi kesalahan jaringan. Periksa koneksi internet Anda."
    }

    messages.value.push({
      role: "bot",
      type: "error",
      content: errorMsg,
      technicalDetail: error.message,
    })
  }

  isLoading.value = false
}

// Auto-scroll to bottom when new messages arrive
watch(
  () => messages.value.length,
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
    <!-- Sidebar -->
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

      <!-- Improve Query Button - Bottom of Sidebar -->
      <div class="sidebar-footer">
        <router-link to="/improve_query" class="improve-query-btn">
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
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          Improve Query
        </router-link>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-main">
      <div
        class="chat-history"
        ref="chatContainer"
        aria-live="polite"
        aria-label="Chat history"
      >
        <!-- Welcome Card -->
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
            >
              Saldo > 10 juta
            </span>
            <span
              @click="userInput = 'Tampilkan transaksi terakhir 5 nasabah'"
              class="suggestion"
            >
              Transaksi terakhir
            </span>
          </div>
        </div>

        <!-- Chat Messages -->
        <ChatMessage
          v-for="(message, index) in messages"
          :key="index"
          :message="message"
          :message-index="index"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @suggestion-click="handleSuggestionClick"
        />

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- Chat Input Form -->
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

<style scoped src="./style.css"></style>

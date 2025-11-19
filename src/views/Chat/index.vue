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

function handleSuggestionClick(suggestionText, triggerPrompt) {
  userInput.value = suggestionText
  handleSubmit(triggerPrompt)
}

async function handleSubmit(triggerPrompt = null) {
  if (triggerPrompt && typeof triggerPrompt === "object") {
    triggerPrompt = null
  }
  if (!userInput.value.trim()) return
  isLoading.value = true
  const currentMessage = userInput.value

  messages.value.push({ role: "user", type: "text", content: currentMessage })
  userInput.value = ""

  const requestPayload = { prompt: currentMessage }
  if (triggerPrompt && typeof triggerPrompt === "string") {
    requestPayload.trigger_prompt = triggerPrompt
  }

  try {
    const response = await fetch("http://localhost:8097/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Terjadi kesalahan dari API")
    }
    const messageIndex = messages.value.length
    if (data.status === "ambiguous") {
      messages.value.push({
        role: "bot",
        type: "suggestion", // Tipe pesan baru
        content: data.message,
        suggestions: data.suggestions,
        originalPrompt: currentMessage,
      })
    }
    // Handle Data Table (seperti biasa)
    else if (data.rows) {
      messages.value.push({
        role: "bot",
        type: "data",
        data: data,
        relatedPrompt: currentMessage,
      })
      if (data.rows.length > 0) {
        initPagination(messageIndex, data.rows.length)
      }
    }
    // Fallback untuk pesan teks biasa (jika ada)
    else {
      messages.value.push({
        role: "bot",
        type: "text",
        content: "Perintah berhasil dieksekusi.",
      })
    }
  } catch (error) {
    let errorMsg = error.message
    if (error.message.includes("Failed to fetch")) {
      errorMsg =
        "Gagal terhubung ke backend. Pastikan backend Go kamu sudah jalan!"
    }
    messages.value.push({ role: "bot", type: "error", content: errorMsg })
  }
  isLoading.value = false
}

async function handleReportWrong(prompt) {
  if (
    !confirm(
      `Apakah Anda yakin jawaban untuk "${prompt}" ini salah? Saya akan melupakannya.`
    )
  )
    return

  isLoading.value = true
  try {
    const response = await fetch("http://localhost:8097/api/cache/forget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    })

    if (!response.ok) throw new Error("Gagal menghapus ingatan")

    alert("Ingatan berhasil dihapus! Silakan tanyakan ulang pertanyaan Anda.")

    // Opsional: Refresh halaman atau hapus chat terakhir agar bersih
    // messages.value.pop() // kalau mau hapus pesan terakhir
  } catch (error) {
    alert("Error: " + error.message)
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
          @suggestion-click="
            handleSuggestionClick($event, message.originalPrompt)
          "
          @report-wrong="handleReportWrong"
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

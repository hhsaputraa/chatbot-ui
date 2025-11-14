<script setup>
import { ref, onMounted, watch, nextTick } from "vue"
import ChatMessage from "./components/ChatMessage.vue"
import { useTablePagination } from "./composables/useTablePagination"

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

<style>
/* CSS Variables */
:root {
  --bg-dark: #121212;
  --bg-darker: #0f0f0f;
  --text-light: #ffffff;
  --text-muted: #8e8ea0;
  --border-color: #3e3e40;
  --primary-blue: #4299e1;
  --input-bg: #2d2d2d;
  --bubble-bot-bg: #2a2a2a;
  --bubble-user-bg: #2c2c2c;
  --shadow: rgba(0, 0, 0, 0.5);
}

/* Global Reset */
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

/* App Layout */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-chat-btn:hover {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.new-chat-btn .icon {
  width: 20px;
  height: 20px;
}

/* Main Chat Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-dark);
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  scroll-behavior: smooth;
}

.chat-history::-webkit-scrollbar {
  width: 8px;
}

.chat-history::-webkit-scrollbar-track {
  background: var(--bg-darker);
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Welcome Card */
.welcome-card {
  max-width: 700px;
  margin: 40px auto;
  padding: 32px;
  background: linear-gradient(
    135deg,
    rgba(66, 153, 225, 0.1) 0%,
    rgba(102, 126, 234, 0.1) 100%
  );
  border: 1px solid var(--border-color);
  border-radius: 16px;
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;
}

.welcome-card h2 {
  font-size: 1.8rem;
  margin-bottom: 12px;
  color: var(--text-light);
}

.welcome-card p {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.suggestions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.suggestion {
  padding: 10px 18px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion:hover {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

/* Loading Dots */
.loading-dots {
  display: flex;
  gap: 6px;
  padding: 20px 24px;
  justify-content: flex-start;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background-color: var(--primary-blue);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Chat Input Form */
.chat-input-form {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background-color: var(--bg-darker);
  border-top: 1px solid var(--border-color);
}

.chat-input {
  flex: 1;
  padding: 14px 18px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 14px 20px;
  background-color: var(--primary-blue);
  color: var(--text-light);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-icon {
  width: 20px;
  height: 20px;
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

/* Responsive Design */
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    padding: 8px;
  }

  .welcome-card {
    margin: 20px;
    padding: 24px;
  }

  .welcome-card h2 {
    font-size: 1.5rem;
  }

  .chat-input-form {
    padding: 12px 16px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .welcome-card,
  .loading-dots span {
    animation: none;
  }
}
</style>

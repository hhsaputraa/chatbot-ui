<script setup>
import { onMounted, onUnmounted, watch, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";
import { useChat } from "../../composables/useChat";
import ChatMessage from "../../components/ChatMessage.vue";
import UserDropdown from "../../components/UserDropdown.vue";

const router = useRouter();
const { logout, isAdmin } = useAuth();
const chatContainer = ref(null);

// Sidebar State
const isSidebarOpen = ref(true);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

// Improve Query Modal State
const showImproveModal = ref(false);

const {
  messages,
  userInput,
  isLoading,
  isEnhancing,
  enhanceCooldown,
  startNewChat,
  handleSubmit,
  handleEnhance,
  handleSuggestionClick,
} = useChat();

// Environment variables for UI text only
const WELCOME_TITLE = import.meta.env.VITE_CHAT_WELCOME_TITLE;
const WELCOME_SUBTITLE = import.meta.env.VITE_CHAT_WELCOME_SUBTITLE;

onMounted(() => {
  startNewChat();
});

// Auto-scroll to bottom when messages change
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  }
);

function openImproveModal(e) {
  e && e.preventDefault();
  showImproveModal.value = true;
}

function closeImproveModal() {
  showImproveModal.value = false;
}

function navigateTo(path) {
  closeImproveModal();
  router.push(path);
}
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: !isSidebarOpen }">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="startNewChat" v-if="isSidebarOpen">
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
      <div v-if="isAdmin && isSidebarOpen" class="sidebar-footer">
        <button class="improve-query-btn" @click="openImproveModal">
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
          Improve AI
        </button>
      </div>

      <!-- Improve Choice Modal -->
      <teleport to="body">
        <div
          v-if="showImproveModal"
          class="improve-modal-overlay"
          @click="closeImproveModal"
        >
          <div class="improve-modal" @click.stop>
            <h3>Pilih</h3>
            <div class="improve-modal-actions">
              <button
                class="btn-secondary"
                @click="navigateTo('/improve_query')"
              >
                Improve Query
              </button>
              <button
                class="btn-primary"
                @click="navigateTo('/improve_knowledge')"
              >
                Improve Knowledge
              </button>
            </div>
            <button
              class="improve-modal-close"
              aria-label="Close"
              @click="closeImproveModal"
            >
              ×
            </button>
          </div>
        </div>
      </teleport>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-main">
      <header class="chat-header">
        <button
          class="toggle-sidebar-btn"
          @click="toggleSidebar"
          :aria-label="isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'"
        >
          <!-- Icon when Sidebar is OPEN: Show 'Collapse' arrow -->
          <svg
            v-if="isSidebarOpen"
            class="icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
            />
          </svg>
          <!-- Icon when Sidebar is CLOSED: Show 'Menu' bars -->
          <svg
            v-else
            class="icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <div class="header-content">
          <UserDropdown />
        </div>
      </header>

      <div
        class="chat-history"
        ref="chatContainer"
        aria-live="polite"
        aria-label="Chat history"
      >
        <div class="chat-content">
          <!-- Welcome Card -->
          <div v-if="messages.length === 1" class="welcome-card">
            <h2>{{ WELCOME_TITLE }}</h2>
            <p>{{ WELCOME_SUBTITLE }}</p>
            <div class="suggestions">
              <span
                @click="
                  handleSuggestionClick(
                    'Tampilkan semua nasabah dengan saldo lebih dari 10 juta'
                  )
                "
                class="suggestion"
              >
                Saldo > 10 juta
              </span>
              <span
                @click="
                  handleSuggestionClick(
                    'Tampilkan transaksi terakhir 5 nasabah'
                  )
                "
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
      </div>

      <!-- Chat Input Form -->
      <form class="chat-input-form" @submit.prevent="handleSubmit">
        <input
          class="chat-input"
          type="text"
          placeholder="silahkan masukan kebutuhan.."
          v-model="userInput"
          :disabled="isLoading || isEnhancing"
          autocomplete="off"
        />
        <button
          type="button"
          @click="handleEnhance"
          :disabled="isEnhancing || enhanceCooldown > 0 || !userInput.trim()"
          class="enhance-btn"
          :title="
            enhanceCooldown > 0
              ? `Cooldown ${enhanceCooldown}s`
              : 'Enhance text ✨'
          "
        >
          <span v-if="isEnhancing" class="enhance-spinner">⏳</span>
          <span v-else-if="enhanceCooldown > 0" class="enhance-cooldown">{{
            enhanceCooldown
          }}</span>
          <span v-else class="enhance-icon">✨</span>
        </button>
        <button
          type="submit"
          :disabled="isLoading || isEnhancing"
          class="send-btn"
        >
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

<style scoped>
/* Import original styles */
@import "./style.css";

/* Additional Header Styles */
.chat-header {
  height: 60px;
  background-color: var(--bg-dark);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: flex-end; /* Align right */
  align-items: center;
}

.spacer {
  flex-grow: 1;
}

/* Ensure chat history takes remaining height */
.chat-history {
  flex-grow: 1;
  overflow-y: auto;
}
</style>

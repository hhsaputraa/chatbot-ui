<script setup>
import { onMounted, onUnmounted, watch, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";
import { useChat } from "../../composables/useChat";
import ChatMessage from "../../components/ChatMessage.vue";
import UserDropdown from "../../components/UserDropdown.vue";
import ModelSelector from "../../components/ModelSelector.vue";

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
  selectedModel,
  startNewChat,
  handleSubmit,
  handleEnhance,
  handleSuggestionClick,
  activeSessionId,
  uploadedFileName,
  uploadFile,
  clearSession
} = useChat();

const fileInputRef = ref(null);

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
    // Reset file input value so same file can be uploaded again
    event.target.value = '';
  }
}

// Environment variables for UI text only
const WELCOME_TITLE = import.meta.env.VITE_CHAT_WELCOME_TITLE;
const WELCOME_SUBTITLE = import.meta.env.VITE_CHAT_WELCOME_SUBTITLE;

onMounted(() => {
  startNewChat();
});

const chatInputRef = ref(null);

// Auto-focus input when loading finishes
watch(isLoading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      chatInputRef.value?.focus();
    });
  }
});

// Smooth Auto-scroll (Optimized: Watch message count & active streaming content)
watch(
  () => [
    messages.value.length,
    messages.value[messages.value.length - 1]?.content
  ],
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

      <!-- Sidebar Footer (Model Selector & Improve AI) -->
      <div v-if="isSidebarOpen" class="sidebar-footer">
        <div class="sidebar-model-selector">
          <ModelSelector v-model="selectedModel" :disabled="isLoading" />
        </div>

        <button v-if="isAdmin" class="improve-query-btn" @click="openImproveModal">
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
          <button
            v-if="isAdmin"
            @click="navigateTo('/admin/otp')"
            class="admin-nav-btn"
          >
            
            User Management
          </button>
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
            :key="message.id || index"
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



      <!-- Session File Badge -->
      <div v-if="activeSessionId" class="session-badge-container">
        <div class="session-badge">
          <span class="session-badge-icon">📂</span>
          <span class="session-badge-text">Memakai data: <strong>{{ uploadedFileName }}</strong></span>
          <button type="button" class="session-badge-close" @click="clearSession" title="Tutup sesi file">&times;</button>
        </div>
      </div>

      <!-- Chat Input Form -->
      <form class="chat-input-form" @submit.prevent="handleSubmit">
        <input
          ref="fileInputRef"
          type="file"
          @change="handleFileChange"
          accept=".csv,.xlsx,.xls"
          style="display: none;"
        />
        <button
          type="button"
          @click="fileInputRef.click()"
          class="attach-btn"
          title="Unggah file CSV/Excel"
          :disabled="isLoading"
        >
          📎
        </button>
        <input
          ref="chatInputRef"
          class="chat-input"
          type="text"
          placeholder="Minta AI untuk membantu anda"
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

      <div class="ai-disclaimer">
        Hasil generasi dibuat oleh AI, wajib dicek kembali kevalidan data.
      </div>
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

.admin-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  margin-right: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-nav-btn:hover {
  background: rgba(245, 158, 11, 0.2);
}

.admin-nav-btn svg {
  width: 18px;
  height: 18px;
}

/* Sidebar Model Selector */
.sidebar-model-selector {
  margin-bottom: 12px;
  width: 100%;
}





/* Improve button adjustment */
.improve-query-btn {
  /* Ensure it matches the full width if not already */
  width: 100%;
}

/* Session and Attachment styles */
.session-badge-container {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  padding: 0 16px;
}

.session-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.session-badge-close {
  background: none;
  border: none;
  color: #10b981;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 4px;
  display: flex;
  align-items: center;
}

.session-badge-close:hover {
  color: #059669;
}

.attach-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 0.2s;
}

.attach-btn:hover {
  color: var(--text-color);
}
</style>

<template>
  <div :class="['message-block', message.role]">
    <!-- Avatar -->
    <div v-if="message.role === 'user'" class="avatar">
      <div class="avatar-user">👤</div>
    </div>

    <!-- Message Content -->
    <div class="message-content">
      <!-- Text Message -->
      <template v-if="message.type === 'text'">
        {{ message.content }}
      </template>

      <!-- Error Message -->
      <template v-else-if="message.type === 'error'">
        <div class="error-card">
          <div class="error-header">
            <Icon icon="heroicons:exclamation-triangle" class="error-icon" />
            <span class="error-title">Terjadi Kesalahan</span>
          </div>
          <p class="error-message">{{ message.content }}</p>

          <!-- Technical Details (Collapsible) -->
        </div>
      </template>

      <!-- Dangerous Intent (Security Block) -->
      <template v-else-if="message.type === 'dangerous'">
        <div class="dangerous-card">
          <div class="dangerous-content">
            <Icon icon="heroicons:shield-exclamation" class="dangerous-icon" />
            <p class="dangerous-message">{{ message.content }}</p>
          </div>
          <!-- Technical Details (Collapsible) -->
        </div>
      </template>

      <!-- Warning Message (Conversational Refusal) -->
      <template v-else-if="message.type === 'warning'">
        <div class="warning-card">
          <div class="warning-icon-wrapper">
            <Icon icon="heroicons:information-circle" class="warning-icon" />
          </div>
          <p class="warning-message">{{ message.content }}</p>
        </div>
      </template>

      <!-- Data Message (Table) -->
      <template v-else-if="message.type === 'data'">
        <!-- No Data -->
        <div
          v-if="
            !message.data ||
            !message.data.rows ||
            message.data.rows.length === 0
          "
          class="no-data"
        >
          <Icon icon="heroicons:inbox" class="empty-icon" />
          <p>Tidak ada data ditemukan.</p>
        </div>

        <!-- Data Table -->
        <DataTable
          v-else
          :message-index="messageIndex"
          :rows="message.data.rows"
          :columns="message.data.columns"
        />
      </template>

      <!-- Suggestion Message -->
      <template v-else-if="message.type === 'suggestion'">
        <div class="suggestion-container">
          <p class="suggestion-text">{{ message.content }}</p>
          <div class="suggestion-chips">
            <button
              v-for="(item, index) in message.suggestions"
              :key="index"
              class="suggestion-chip"
              @click="$emit('suggestion-click', item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import DataTable from "./DataTable.vue";
import { Icon } from "@iconify/vue";

const emit = defineEmits(["suggestion-click"]);

defineProps({
  message: {
    type: Object,
    required: true,
  },
  messageIndex: {
    type: Number,
    required: true,
  },
});

const showDetails = ref(false);

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
</script>

<style scoped>
/* Message Block */
.message-block {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  animation: fadeIn 0.3s ease-in-out;
  animation-fill-mode: both;
}

.message-block.user {
  flex-direction: row-reverse;
}

.message-block.bot {
  flex-direction: row;
}

/* Avatar */
.avatar {
  flex-shrink: 0;
}

.avatar-user,
.avatar-bot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.avatar-bot {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

/* Message Content */
.message-content {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.message-block.user .message-content {
  background-color: var(--bubble-user-bg);
  border: 1px solid var(--border-color);
}

.message-block.bot .message-content {
  background-color: var(--bubble-bot-bg);
  border: 1px solid var(--border-color);
}

/* Error Card Redesign */
.error-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: rgba(239, 68, 68, 0.08); /* More subtle red */
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #ef4444; /* Accent Border */
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  border-right: 1px solid rgba(239, 68, 68, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #ef4444;
}

.error-title {
  font-weight: 600;
  color: #fca5a5;
  font-size: 0.95rem;
}

.error-message {
  color: #e2e8f0;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

/* Technical Details Toggle */
.technical-details {
  margin-top: 8px;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  padding-top: 8px;
}

.details-toggle {
  background: none;
  border: none;
  color: #fca5a5;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  transition: opacity 0.2s;
}

.details-toggle:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.details-content {
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
}

.details-content code {
  color: #f87171;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
}

/* Dangerous Card (Security Block) */
.dangerous-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: rgba(220, 38, 38, 0.15); /* Stronger Red */
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #dc2626;
}

.dangerous-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dangerous-icon {
  width: 24px;
  height: 24px;
  color: #dc2626;
  flex-shrink: 0;
}

.dangerous-message {
  color: #fca5a5;
  margin: 0;
  line-height: 1.5;
  font-size: 1rem;
  font-weight: 700; /* Bold as requested */
  letter-spacing: 0.02em;
}

/* Warning Card (Soft Refusal) */
.warning-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: rgba(245, 158, 11, 0.1); /* Soft Amber */
  padding: 14px 18px;
  border-radius: 12px;
  border-left: 4px solid #f59e0b;
}

.warning-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  padding-top: 2px;
}

.warning-icon {
  width: 20px;
  height: 20px;
  color: #f59e0b;
}

.warning-message {
  color: #fce7f3; /* Light warm text */
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* No Data */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px dashed var(--border-color);
  text-align: center;
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  opacity: 0.5;
}

.no-data p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

/* Suggestions */
.suggestion-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-text {
  margin: 0;
  font-weight: 500;
  color: #e2e8f0;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  background-color: rgba(66, 153, 225, 0.1);
  border: 1px solid rgba(66, 153, 225, 0.3);
  color: #63b3ed;
  padding: 8px 16px;
  border-radius: 99px; /* Capsule */
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.suggestion-chip:hover {
  background-color: rgba(66, 153, 225, 0.2);
  transform: translateY(-1px);
  border-color: #63b3ed;
}

.suggestion-chip:active {
  transform: translateY(0);
}

/* Animation */
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

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

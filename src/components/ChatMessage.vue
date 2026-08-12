<template>
  <div :class="['message-block', message.role]">
    <!-- Avatar -->
    <div v-if="message.role === 'user'" class="avatar">
      <div class="avatar-user">👤</div>
    </div>

    <!-- Message Wrapper -->
    <div class="message-wrapper">
      <!-- Message Content -->
      <div :class="['message-content', { 'insight-content-override': message.type === 'insight' }]">

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
            variant="chat"
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

        <!-- Insight Message -->
        <template v-else-if="message.type === 'insight'">
          <div class="insight-view">
            <div class="insight-body" v-html="formattedInsight"></div>
          </div>
        </template>
      </div>

      <!-- Message Action Bar (OUTSIDE Bubble - Icon Only) -->
      <div class="message-actions">
        <button
          class="copy-btn"
          @click="copyText"
          :title="copied ? 'Tersalin!' : 'Salin Teks'"
          :aria-label="copied ? 'Tersalin!' : 'Salin Teks'"
        >
          <Icon
            :icon="copied ? 'heroicons:check' : 'heroicons:document-duplicate'"
            :class="['copy-icon', { copied }]"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import DataTable from "./DataTable.vue";
import { Icon } from "@iconify/vue";

const emit = defineEmits(["suggestion-click"]);

const props = defineProps({
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

const formatMarkdown = (text) => {
  if (!text) return "";
  let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return formatted;
};

const formattedInsight = computed(() => formatMarkdown(props.message?.content || ""));


const copied = ref(false);
let copyTimer = null;

const getCopyableText = () => {
  if (props.message?.type === "data" && props.message?.data) {
    const { columns, rows } = props.message.data;
    if (Array.isArray(columns) && Array.isArray(rows)) {
      const header = columns.join("\t");
      const body = rows
        .map((row) =>
          columns
            .map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return "";
              if (typeof val === "object") return JSON.stringify(val);
              return String(val);
            })
            .join("\t")
        )
        .join("\n");
      return `${header}\n${body}`;
    }
  }
  return props.message?.content || "";
};

const copyText = async () => {
  const text = getCopyableText();
  if (!text) return;

  let success = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (err) {
      console.warn("navigator.clipboard failed, falling back to execCommand:", err);
    }
  }

  if (!success) {
    try {
      const activeEl = document.activeElement;
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (activeEl && typeof activeEl.focus === "function") {
        activeEl.focus();
      }
    } catch (err) {
      console.error("Fallback execCommand failed:", err);
    }
  }

  if (success) {
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
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

/* Message Wrapper */
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.message-block.user .message-wrapper {
  align-items: flex-end;
}

.message-block.bot .message-wrapper {
  align-items: flex-start;
}

/* Message Content */
.message-content {
  width: fit-content;
  max-width: 100%;
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

.message-block.bot .insight-content-override {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  max-width: 100%;
  padding: 0;
  margin-top: 8px;
}

.insight-view {
  padding: 8px 4px;
  color: #e2e8f0;
}

.insight-body {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.95rem;
  color: #cbd5e1;
}

.insight-body :deep(strong) {
  color: #90cdf4; /* Warna tebal yang sedikit biru muda (tailwind blue-300) agar natural namun rapi */
  font-weight: 600;
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

/* Message Actions Bar (OUTSIDE Bubble) */
.message-actions {
  display: flex;
  align-items: center;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.message-block:hover .message-actions {
  opacity: 1;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-muted, #a0aec0);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.copy-icon {
  width: 16px;
  height: 16px;
}

.copy-icon.copied {
  color: #48bb78;
}
</style>

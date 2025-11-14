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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
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
    </div>

    <!-- Bot Avatar -->
    <div v-if="message.role === 'bot'" class="avatar">
      <div class="avatar-bot">🤖</div>
    </div>
  </div>
</template>

<script setup>
import DataTable from "./DataTable.vue"

defineProps({
  message: {
    type: Object,
    required: true,
  },
  messageIndex: {
    type: Number,
    required: true,
  },
})
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
</style>

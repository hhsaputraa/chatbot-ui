<script setup>
import { useToast } from "../composables/useToast";

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <!-- Success Icon -->
          <svg
            v-if="toast.type === 'success'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Error Icon -->
          <svg
            v-else-if="toast.type === 'error'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Info Icon -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Let clicks pass through container area */
}

.toast-item {
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-darker);
  color: var(--text-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.toast-success {
  border-left-color: #10b981;
  background: linear-gradient(
    to right,
    rgba(16, 185, 129, 0.1),
    var(--bg-darker)
  );
}

.toast-error {
  border-left-color: #ef4444;
  background: linear-gradient(
    to right,
    rgba(239, 68, 68, 0.1),
    var(--bg-darker)
  );
}

.toast-info {
  border-left-color: #3b82f6;
  background: linear-gradient(
    to right,
    rgba(59, 130, 246, 0.1),
    var(--bg-darker)
  );
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: #10b981;
}
.toast-error .toast-icon {
  color: #ef4444;
}
.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-message {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.toast-close:hover {
  color: var(--text-light);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

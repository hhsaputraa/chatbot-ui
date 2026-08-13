<script setup>
import { useToast } from "../composables/useToast";
import { Icon } from "@iconify/vue";

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
          <Icon
            v-if="toast.type === 'success'"
            icon="solar:check-circle-bold"
          />
          <!-- Error Icon -->
          <Icon
            v-else-if="toast.type === 'error'"
            icon="solar:danger-circle-bold"
          />
          <!-- Info Icon -->
          <Icon
            v-else
            icon="solar:info-circle-bold"
          />
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

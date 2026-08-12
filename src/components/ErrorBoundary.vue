<script setup>
import { ref, onErrorCaptured } from "vue"
import { Icon } from "@iconify/vue"

const hasError = ref(false)
const errorMessage = ref("")
const errorInfo = ref("")

onErrorCaptured((err, instance, info) => {
  console.error("[ErrorBoundary] Caught error:", err, info)
  hasError.value = true
  errorMessage.value = err?.message || "Terjadi kesalahan yang tidak terduga pada tampilan."
  errorInfo.value = info || ""
  // Return false to prevent error from propagating further up
  return false
})

function resetError() {
  hasError.value = false
  errorMessage.value = ""
  errorInfo.value = ""
  window.location.reload()
}
</script>

<template>
  <div v-if="hasError" class="error-boundary-wrapper">
    <div class="error-boundary-card">
      <div class="error-icon-wrapper">
        <Icon icon="solar:shield-warning-bold-duotone" class="warning-icon" />
      </div>
      <h2 class="error-title">Terjadi Kesalahan Tampilan</h2>
      <p class="error-desc">
        Aplikasi mengalami kendala saat memuat komponen ini. Anda dapat mencoba memuat ulang halaman.
      </p>
      
      <div v-if="errorMessage" class="error-details">
        <code>{{ errorMessage }}</code>
      </div>

      <div class="error-actions">
        <button @click="resetError" class="retry-btn">
          <Icon icon="solar:refresh-bold" />
          <span>Muat Ulang Halaman</span>
        </button>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<style scoped>
.error-boundary-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.error-boundary-card {
  max-width: 480px;
  width: 100%;
  background: #18181b;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.error-icon-wrapper {
  display: inline-flex;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  margin-bottom: 1rem;
}

.warning-icon {
  font-size: 2.5rem;
  color: #ef4444;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f4f4f5;
  margin-bottom: 0.5rem;
}

.error-desc {
  font-size: 0.875rem;
  color: #a1a1aa;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.error-details {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  text-align: left;
  overflow-x: auto;
}

.error-details code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.75rem;
  color: #f87171;
  word-break: break-all;
}

.error-actions {
  display: flex;
  justify-content: center;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #047857;
  transform: translateY(-1px);
}
</style>

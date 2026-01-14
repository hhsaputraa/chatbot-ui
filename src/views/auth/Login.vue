<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

const { login, error: authError, isLoading } = useAuth();
const { addToast } = useToast();
const router = useRouter();

const username = ref("");
const password = ref("");

const isFormValid = computed(() => {
  return username.value.trim() !== "" && password.value.trim() !== "";
});

const handleSubmit = async () => {
  if (!username.value || !password.value) return;

  const success = await login(username.value, password.value);

  if (success) {
    addToast("Login Berhasil!", "success");
  } else {
    addToast(authError.value || "Login gagal", "error");
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">LOGIN</h2>
        <p class="auth-subtitle">Login ke assistant AI</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="username">Username</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:user" class="input-icon" />
            <input
              v-model="username"
              type="text"
              id="username"
              placeholder="Masukan Username"
              required
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:lock-closed" class="input-icon" />
            <input
              v-model="password"
              type="password"
              id="password"
              placeholder="Masukan Password"
              required
              :disabled="isLoading"
            />
          </div>
        </div>

        <button
          type="submit"
          class="auth-btn"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Login</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>
          <router-link to="/register">Buat Akun</router-link>
        </p>
        <p style="margin-top: 8px;">
            <router-link to="/login-otp" style="font-size: 0.85rem; color: var(--text-muted); text-decoration: none; opacity: 0.8;">
                <span class="hover-underline">Lupa Password</span>
            </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.15),
      transparent 40%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(168, 85, 247, 0.15),
      transparent 40%
    ),
    var(--bg-dark);
}

.auth-card {
  background-color: var(--bg-darker);
  padding: 2.5rem;
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

/* Glass-like aesthetic top highlight */
.auth-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  color: var(--text-light);
  font-weight: 600;
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  font-size: 1.25rem;
  transition: color 0.2s;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-light);
  padding: 0.875rem 1rem 0.875rem 2.75rem; /* Left padding for icon */
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper input:focus {
  border-color: var(--primary-blue);
  background-color: rgba(59, 130, 246, 0.05); /* Very subtle blue tint */
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.input-wrapper input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: var(--primary-blue);
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.auth-btn {
  background: linear-gradient(
    135deg,
    var(--primary-blue) 0%,
    var(--primary-blue-hover) 100%
  );
  color: white;
  padding: 0;
  border-radius: 12px;
  font-weight: 600;
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  font-size: 1rem;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.auth-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--primary-blue);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.2s;
}

.auth-footer a:hover {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-bottom-color: white;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 0.8s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

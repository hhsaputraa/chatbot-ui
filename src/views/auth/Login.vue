<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useRouter } from "vue-router";

const { login, error: authError, isLoading } = useAuth();
const router = useRouter();

const username = ref("");
const password = ref("");

const isFormValid = computed(() => {
  return username.value.trim() !== "" && password.value.trim() !== "";
});

const handleSubmit = async () => {
  if (!username.value || !password.value) return;

  // Login logs success and redirects inside composable, or returns false
  await login(username.value, password.value);
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Login</h2>
      <p class="auth-subtitle">Masuk untuk mengakses asisten bank Anda</p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="authError" class="error-alert">
          {{ authError }}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            v-model="username"
            type="text"
            id="username"
            placeholder="Masukan username"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="Masukan password"
            required
            :disabled="isLoading"
          />
        </div>

        <button
          type="submit"
          class="auth-btn"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Belum punya akun?
          <router-link to="/register">Daftar sekarang</router-link>
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
  background-color: var(--bg-dark);
}

.auth-card {
  background-color: var(--bg-darker);
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  animation: fadeIn 0.5s ease-out;
}

.auth-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.5rem;
  text-align: center;
}

.auth-subtitle {
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
}

.form-group input {
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--text-light);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.auth-btn {
  background-color: var(--primary-blue);
  color: white;
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
}

.auth-btn:hover:not(:disabled) {
  filter: brightness(110%);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--primary-blue);
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-alert {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

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

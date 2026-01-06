<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useRouter } from "vue-router";

const { register, error: authError, isLoading } = useAuth();
const router = useRouter();

const form = ref({
  username: "",
  password: "",
  fullName: "",
  email: "",
});

const successMessage = ref("");

const isFormValid = computed(() => {
  return (
    form.value.username.trim() !== "" &&
    form.value.password.trim() !== "" &&
    form.value.fullName.trim() !== "" &&
    form.value.email.trim() !== ""
  );
});

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) return;

  const success = await register(
    form.value.username,
    form.value.password,
    form.value.fullName,
    form.value.email
  );

  if (success) {
    successMessage.value =
      "Registrasi berhasil! Mengalihkan ke halaman login...";
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Registrasi Akun</h2>
      <p class="auth-subtitle">Buat akun untuk memulai</p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="authError" class="error-alert">
          {{ authError }}
        </div>
        <div v-if="successMessage" class="success-alert">
          {{ successMessage }}
        </div>

        <div class="form-group">
          <label>Full Name</label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="Nama Lengkap"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Username</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="username"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="min 6 karakter"
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
          <span v-else>Daftar</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Sudah punya akun? <router-link to="/login">Masuk disini</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reusing styles from Login.vue for consistency, assuming similar structure. 
In a larger app, we'd extract these to a shared CSS file or component. */

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
  max-width: 450px; /* Slightly wider for registration */
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

.success-alert {
  background-color: rgba(52, 211, 153, 0.1);
  border: 1px solid #10b981;
  color: #34d399;
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

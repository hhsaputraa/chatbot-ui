<script setup>
import { ref, computed } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

const { register, error: authError, isLoading } = useAuth();
const { addToast } = useToast();
const router = useRouter();

const form = ref({
  username: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  email: "",
});

const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Password Validation Rules
const passwordRules = computed(() => {
  const pwd = form.value.password;
  return {
    minLength: pwd.length >= 6,
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
  };
});

// Strength Score
const strengthScore = computed(() => {
  let score = 0;
  if (passwordRules.value.minLength) score++;
  if (passwordRules.value.hasUpper) score++;
  if (passwordRules.value.hasNumber) score++;
  if (passwordRules.value.hasSymbol) score++;
  return score;
});

// Strength Label & Color
const strengthInfo = computed(() => {
  const score = strengthScore.value;
  if (score === 0)
    return {
      label: "Enter Password",
      color: "var(--border-color)",
      width: "0%",
    };
  if (score < 2) return { label: "Weak", color: "#EF4444", width: "25%" };
  if (score < 3) return { label: "Fair", color: "#F59E0B", width: "50%" };
  if (score < 4) return { label: "Good", color: "#3B82F6", width: "75%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
});

const passwordsMatch = computed(() => {
  return (
    form.value.password && form.value.password === form.value.confirmPassword
  );
});

const isFormValid = computed(() => {
  return (
    form.value.username.trim() !== "" &&
    form.value.fullName.trim() !== "" &&
    form.value.email.trim() !== "" &&
    strengthScore.value === 4 &&
    passwordsMatch.value
  );
});

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  const success = await register(
    form.value.username,
    form.value.password,
    form.value.fullName,
    form.value.email
  );

  if (success) {
    addToast("Registrasi berhasil! Mengalihkan ke halaman login...", "success");
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  } else {
    addToast(authError.value || "Registrasi gagal", "error");
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">Create Account</h2>
        <p class="auth-subtitle">Get started with your intelligent assistant</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- Full Name (Full Width) -->
        <div class="form-group span-full">
          <label>Full Name</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:identification" class="input-icon" />
            <input
              v-model="form.fullName"
              type="text"
              placeholder="Enter your full name"
              required
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Username -->
        <div class="form-group">
          <label>Username</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:user" class="input-icon" />
            <input
              v-model="form.username"
              type="text"
              placeholder="Choose username"
              required
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label>Email</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:envelope" class="input-icon" />
            <input
              v-model="form.email"
              type="email"
              placeholder="name@example.com"
              required
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:lock-closed" class="input-icon" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              required
              :disabled="isLoading"
            />
            <button
              type="button"
              class="eye-btn"
              @click="togglePassword"
              tabindex="-1"
            >
              <Icon
                :icon="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
              />
            </button>
          </div>
          <!-- Strength Bar -->
          <div class="strength-meter" v-if="form.password">
            <div class="strength-bar-bg">
              <div
                class="strength-bar-fill"
                :style="{
                  width: strengthInfo.width,
                  backgroundColor: strengthInfo.color,
                }"
              ></div>
            </div>
            <span
              class="strength-label"
              :style="{ color: strengthInfo.color }"
              >{{ strengthInfo.label }}</span
            >
          </div>
          <!-- Requirements Checklist -->
          <ul class="pw-requirements" v-if="form.password && strengthScore < 4">
            <li :class="{ met: passwordRules.minLength }">6+ chars</li>
            <li :class="{ met: passwordRules.hasUpper }">Upper</li>
            <li :class="{ met: passwordRules.hasNumber }">Num</li>
            <li :class="{ met: passwordRules.hasSymbol }">Sym</li>
          </ul>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label>Confirm Password</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:lock-closed" class="input-icon" />
            <input
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm"
              required
              :disabled="isLoading"
            />
            <Icon
              v-if="passwordsMatch && form.confirmPassword"
              icon="heroicons:check-circle"
              class="match-icon success"
            />
            <Icon
              v-else-if="!passwordsMatch && form.confirmPassword"
              icon="heroicons:x-circle"
              class="match-icon error"
            />
          </div>
        </div>

        <!-- Submit Button (Full Width) -->
        <button
          type="submit"
          class="auth-btn span-full"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Register</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Already have an account?
          <router-link to="/login">Sign in</router-link>
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
  padding: 20px;
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
  max-width: 700px; /* Widened for Grid Layout */
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

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

/* Grid Layout */
.auth-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Modifier to span full width in grid */
.span-full {
  grid-column: span 2;
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

.match-icon {
  position: absolute;
  right: 14px;
  font-size: 1.25rem;
  pointer-events: none;
}
.match-icon.success {
  color: #10b981;
}
.match-icon.error {
  color: #ef4444;
}

.input-wrapper input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-light);
  padding: 0.875rem 2.75rem 0.875rem 2.75rem;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper input:focus {
  border-color: var(--primary-blue);
  background-color: rgba(59, 130, 246, 0.05);
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

.eye-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.eye-btn:hover {
  color: var(--text-light);
  background-color: rgba(255, 255, 255, 0.05);
}

.strength-meter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: 0.8rem;
}

.strength-bar-bg {
  flex: 1;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-label {
  font-weight: 600;
  width: 50px;
  text-align: right;
}

.pw-requirements {
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pw-requirements li {
  font-size: 0.7rem; /* Slightly smaller for grid layout */
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.pw-requirements li.met {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
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

/* Responsive Grid */
@media (max-width: 640px) {
  .auth-card {
    padding: 1.5rem;
    max-width: 90vw;
  }

  .auth-form {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .span-full {
    grid-column: span 1;
  }
}
</style>

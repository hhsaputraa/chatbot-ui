<template>
  <div class="admin-container">
    <!-- Re-authentication Overlay -->
    <div v-if="!isVerified" class="auth-overlay">
      <div class="auth-box">
        <Icon icon="solar:shield-warning-bold" class="auth-icon" />
        <h2>Security Check</h2>
        <p>Silahkan masukkan password admin anda untuk melanjutkan.</p>
        
        <form @submit.prevent="verifyPassword">
          <div class="input-wrapper">
            <Icon icon="heroicons:lock-closed" class="input-icon" />
            <input 
              v-model="authPassword" 
              type="password" 
              placeholder="Admin Password"
              ref="authInput"
              :disabled="verifying"
            />
          </div>
          <p v-if="verifyError" class="error-text">{{ verifyError }}</p>
          <button type="submit" class="verify-btn" :disabled="verifying || !authPassword">
             <span v-if="verifying" class="loader"></span>
             <span v-else>Verifikasi</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Main Content (Hidden/Blurry behind overlay if not verified, but we use v-if for security) -->
    <div v-if="isVerified" class="content-wrapper">
      <div class="admin-header">
        <div class="header-left">
          <Icon icon="solar:shield-user-bold" class="header-icon" />
          <div>
            <h2>User & OTP Management</h2>
            <p>Kelola password user via OTP</p>
          </div>
        </div>
        <button @click="fetchUsers" :disabled="isLoading" class="refresh-btn">
          <Icon icon="heroicons:arrow-path" :class="{ 'spin': isLoading }" />
          Refresh Data
        </button>
      </div>

      <!-- User Table -->
      <div class="table-container">
        <DataTable 
          :columns="columns" 
          :rows="users" 
          :loading="isLoading"
        >
          <template #cell-account_status="{ cell }">
             <span :class="['status-badge', getStatusBadge(cell).class]">
              {{ getStatusBadge(cell).label }}
            </span>
          </template>

          <template #cell-is_active="{ cell }">
            <span :class="['status-badge', cell ? 'active' : 'inactive']">
              {{ cell ? 'Active' : 'Inactive' }}
            </span>
          </template>
          
          <template #cell-action="{ row }">
            <button @click="openOtpModal(row)" class="action-btn">
              
              Generate OTP
            </button>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Enhanced OTP Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card wide-modal">
        <div class="modal-header">
          <h3>Generate OTP Access</h3>
          <button @click="closeModal" class="close-btn"><Icon icon="heroicons:x-mark" /></button>
        </div>

        <div class="modal-body-grid">
          <!-- Left Col: Form -->
          <div class="section-form">
            <div class="input-group">
              <label>Username Target</label>
              <div class="input-wrapper">
                <Icon icon="heroicons:user" class="input-icon" />
                <input 
                  :value="selectedUser?.username" 
                  type="text" 
                  disabled
                  class="disabled-input"
                />
              </div>
            </div>

            <div class="input-group">
              <label>Set Default Password</label>
              <div class="input-wrapper">
                <Icon icon="heroicons:lock-closed" class="input-icon" />
                <input 
                  v-model="defaultPassword" 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="Password sementara"
                  :disabled="isGenerating"
                />
                <div class="input-actions">
                  <button type="button" class="icon-btn" @click="generateRandomPassword" title="Auto Generate">
                    <Icon icon="heroicons:arrow-path-rounded-square" />
                  </button>
                  <button type="button" class="icon-btn" @click="showPassword = !showPassword" title="Toggle Visibility">
                     <Icon :icon="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" />
                  </button>
                </div>
              </div>
              <small>Password user akan direset menjadi ini.</small>
            </div>

            <button 
              @click="handleGenerate" 
              class="generate-btn"
              :disabled="isGenerating || !defaultPassword"
            >
              <span v-if="isGenerating" class="loader"></span>
              <span v-else>Generate & Reset</span>
            </button>
          </div>

          <!-- Right Col: Result -->
          <div class="section-result">
            <div v-if="!generatedOtp" class="empty-state">
              <Icon icon="solar:shield-keyhole-linear" class="empty-icon" />
              <p>Masukkan password default dan klik Generate untuk mendapatkan kode OTP.</p>
            </div>

            <div v-else class="result-content">
              <div class="result-header-small">
                <Icon icon="heroicons:check-badge" class="success-icon" />
                <span>Success!</span>
              </div>
              
              <div class="otp-display">{{ generatedOtp }}</div>
              
              <div class="credential-box">
                <div class="cred-row">
                  <span>Username:</span>
                  <strong>{{ selectedUser?.username }}</strong>
                </div>
                <div class="cred-row">
                  <span>Password:</span>
                  <strong>{{ defaultPassword }}</strong>
                </div>
                <div class="cred-row">
                  <span>OTP Code:</span>
                  <strong style="color: #10b981;">{{ generatedOtp }}</strong>
                </div>
                <div class="cred-expiry">Valid selama 5 menit</div>
              </div>

               <button @click="copyCredentials" class="copy-btn">
                <Icon icon="heroicons:clipboard-document" />
                {{ copied ? 'Copied!' : 'Copy Kredensial' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useAdmin } from '../../composables/useAdmin';
import { useAdminOtp } from '../../composables/useAdminOtp';
import { useAuth } from '../../composables/useAuth';
import DataTable from '../../components/DataTable.vue';
import { Icon } from '@iconify/vue';
import { useToast } from '../../composables/useToast';

const { getUsers, isLoading } = useAdmin();
const { generateOtp, isLoading: isGenerating, generatedOtp } = useAdminOtp();
const { login, user } = useAuth();
const { addToast } = useToast();

const users = ref([]);
const columns = ['id_app_users', 'username', 'full_name', 'email', 'account_status', 'is_active', 'action'];

const showModal = ref(false);
const selectedUser = ref(null);
const defaultPassword = ref('');
const showPassword = ref(false);
const copied = ref(false);

// Re-Auth State
const isVerified = ref(false);
const authPassword = ref('');
const verifying = ref(false);
const verifyError = ref('');
const authInput = ref(null);

const verifyPassword = async () => {
    if (!authPassword.value) return;
    verifying.value = true;
    verifyError.value = '';

    try {
        // Reuse login logic to verify password, disable redirect
        const success = await login(user.value.username, authPassword.value, false);
        if (success) {
            isVerified.value = true;
            fetchUsers();
        } else {
            verifyError.value = 'Password salah.';
        }
    } catch(e) {
        verifyError.value = 'Terjadi kesalahan verifikasi.';
    } finally {
        verifying.value = false;
    }
};

const fetchUsers = async () => {
  const rawUsers = await getUsers();
  users.value = rawUsers.map(u => [
    u.id_app_users,
    u.username,
    u.full_name,
    u.email,
    u.account_status,
    u.is_active,
    '' 
  ]);
};

const openOtpModal = (row) => {
  selectedUser.value = {
    username: row[1],
    id: row[0]
  };
  defaultPassword.value = ''; 
  generatedOtp.value = null;  
  showModal.value = true;
  copied.value = false;
};

const getStatusBadge = (status) => {
    switch(status) {
        case 0: return { label: 'Active', class: 'active' };
        case 1: return { label: 'Pending', class: 'pending' };
        case 2: return { label: 'Reset', class: 'reset' };
        case 3: return { label: 'Blocked', class: 'blocked' };
        default: return { label: 'Unknown', class: 'inactive' };
    }
};

const closeModal = () => {
  showModal.value = false;
  selectedUser.value = null;
  generatedOtp.value = null;
};

const generateRandomPassword = () => {
    const chars = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]|\\:;\"'<,>.?/";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    defaultPassword.value = pass;
    showPassword.value = true; // Show it so admin can see
};

const handleGenerate = async () => {
  if (!selectedUser.value || !defaultPassword.value) return;
  await generateOtp(selectedUser.value.username, defaultPassword.value);
};

const copyCredentials = async () => {
    const text = `Halo ${selectedUser.value?.username},\nBerikut akses sementara anda:\n\nUsername: ${selectedUser.value?.username}\nOTP: ${generatedOtp.value}\nPassword lama: ${defaultPassword.value}\n\nBerlaku 5 menit. Segera login dan ganti password.`;
    
    try {
        await navigator.clipboard.writeText(text);
        copied.value = true;
        addToast("Kredensial disalin ke clipboard", "success");
        setTimeout(() => copied.value = false, 2000);
    } catch (err) {
        addToast("Gagal menyalin", "error");
    }
};

onMounted(() => {
    // Focus on auth input
    nextTick(() => {
        if(authInput.value) authInput.value.focus();
    });
});
</script>

<style scoped>
.admin-container {
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  min-height: 80vh;
}

/* AUTH OVERLAY */
.auth-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
    background: var(--bg-dark);
    display: flex;
    justify-content: center;
    align-items: center;
}

.auth-box {
    background: var(--bg-darker);
    padding: 3rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    text-align: center;
    max-width: 400px;
    width: 90%;
    animation: fadeIn 0.4s ease;
}

.auth-icon {
    font-size: 3rem;
    color: #f59e0b;
    margin-bottom: 1rem;
}

.auth-box h2 {
    color: var(--text-light);
    margin-bottom: 0.5rem;
}

.auth-box p {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.error-text {
    color: #ef4444;
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

.verify-btn {
    background: #f59e0b;
    color: white;
    border: none;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 1rem;
    cursor: pointer;
}

/* TABLE & CONTENT */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  color: #f59e0b;
}

.header-left h2 {
  color: var(--text-light);
  margin: 0;
}

.header-left p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.refresh-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-light);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.table-container {
  background: var(--bg-darker);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 1rem;
  overflow: hidden;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.status-badge.reset { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.status-badge.blocked { background: rgba(239, 68, 68, 0.2); color: #ef4444; text-decoration: line-through; }

.action-btn {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(245, 158, 11, 0.2);
}

/* MODAL STYLES */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 100%;
  max-width: 480px; /* Default */
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.wide-modal {
    max-width: 800px; /* Wider for 2 cols */
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-light);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
}

.modal-body-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0; /* Divide by border */
}

.section-form {
    padding: 1.5rem;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.section-result {
    padding: 1.5rem;
    background: rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Responsive modal: stack on small screens */
@media (max-width: 768px) {
    .wide-modal { max-width: 95vw; }
    .modal-body-grid { grid-template-columns: 1fr; }
    .section-form { border-right: none; border-bottom: 1px solid var(--border-color); }
}

/* FORM ELEMENTS */
.input-group { display: flex; flex-direction: column; gap: 0.5rem; }
.input-group label { color: var(--text-light); font-size: 0.9rem; font-weight: 500; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: var(--text-muted); font-size: 1.2rem; }
.input-wrapper input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  padding: 10px 10px 10px 40px; /* Space for icon */
  padding-right: 80px; /* Space for action buttons */
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
}
.input-actions {
    position: absolute;
    right: 8px;
    display: flex;
    gap: 4px;
}
.icon-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: all 0.2s;
}
.icon-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-light); }

.disabled-input { opacity: 0.6; cursor: not-allowed; background: rgba(255, 255, 255, 0.02) !important; }

.generate-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
}
.generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* RESULT AREA */
.empty-state { text-align: center; color: var(--text-muted); opacity: 0.7; padding: 2rem; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

.result-content { width: 100%; animation: fadeIn 0.3s ease; }
.result-header-small { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 700; margin-bottom: 1rem; }
.otp-display {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 4px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  border: 1px dashed #10b981;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.credential-box {
    background: var(--bg-dark);
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text-light);
    border: 1px solid var(--border-color);
}
.cred-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
.cred-row:last-child { border-bottom: none; }
.cred-expiry { font-size: 0.75rem; color: #f59e0b; margin-top: 0.5rem; text-align: center; font-style: italic; }

.copy-btn {
    width: 100%;
    margin-top: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-light);
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}
.copy-btn:hover { background: rgba(255, 255, 255, 0.1); }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-left">
        <Icon icon="solar:shield-user-bold" class="header-icon" />
        <div>
          <h2>User Management & OTP</h2>
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
        <template #cell-is_active="{ cell }">
          <span :class="['status-badge', cell ? 'active' : 'inactive']">
            {{ cell ? 'Active' : 'Inactive' }}
          </span>
        </template>
        
        <template #cell-action="{ row }">
          <button @click="openOtpModal(row)" class="action-btn">
            <Icon icon="solar:key-square-bold" />
            Generate OTP
          </button>
        </template>
      </DataTable>
    </div>

    <!-- OTP Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Generate OTP for {{ selectedUser?.username }}</h3>
          <button @click="closeModal" class="close-btn"><Icon icon="heroicons:x-mark" /></button>
        </div>

        <div class="modal-body">
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
              <button
                 type="button"
                 class="eye-btn"
                 @click="showPassword = !showPassword"
                 tabindex="-1"
               >
                 <Icon
                   :icon="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
                 />
               </button>
            </div>
            <small>Password user akan direset menjadi ini.</small>
          </div>

          <!-- Action Button -->
          <button 
            @click="handleGenerate" 
            class="generate-btn"
            :disabled="isGenerating || !defaultPassword"
          >
            <span v-if="isGenerating" class="loader"></span>
            <span v-else>Generate OTP</span>
          </button>

          <!-- Result Display -->
          <div v-if="generatedOtp" class="result-card">
            <div class="result-header">
              <Icon icon="heroicons:check-badge" class="success-icon" />
              <span>OTP Berhasil Dibuat!</span>
            </div>
            
            <div class="otp-display">{{ generatedOtp }}</div>
            
            <div class="copy-section">
              <p class="instruction">Berikan kredensial ini ke user:</p>
              <div class="credential-box">
                <p><strong>Username:</strong> {{ selectedUser?.username }}</p>
                <p><strong>Password:</strong> {{ defaultPassword }}</p>
                <p><strong>OTP Code:</strong> {{ generatedOtp }} (Valid 5 menit)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';
import { useAdminOtp } from '../../composables/useAdminOtp';
import DataTable from '../../components/DataTable.vue';
import { Icon } from '@iconify/vue';

const { getUsers, isLoading } = useAdmin();
const { generateOtp, isLoading: isGenerating, generatedOtp } = useAdminOtp();

const users = ref([]);
const columns = ['id_app_users', 'username', 'full_name', 'email', 'is_active', 'action'];

const showModal = ref(false);
const selectedUser = ref(null);
const defaultPassword = ref('');
const showPassword = ref(false);

const fetchUsers = async () => {
  const rawUsers = await getUsers();
  // Transform object array to array of arrays matching columns
  // Columns: ['id_app_users', 'username', 'full_name', 'email', 'is_active', 'action']
  users.value = rawUsers.map(u => [
    u.id_app_users,
    u.username,
    u.full_name,
    u.email,
    u.is_active,
    '' // action placeholder
  ]);
};

const openOtpModal = (row) => {
  // row is array: [id, username, full_name, email, is_active, action]
  // We need to reconstruct object for selectedUser to work with existing template or update template
  selectedUser.value = {
    username: row[1],
    id: row[0]
  };
  defaultPassword.value = ''; // Reset password input
  generatedOtp.value = null;  // Reset previous result
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedUser.value = null;
  generatedOtp.value = null;
};

const handleGenerate = async () => {
  if (!selectedUser.value || !defaultPassword.value) return;
  
  await generateOtp(selectedUser.value.username, defaultPassword.value);
  // We keep modal open to show result
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.admin-container {
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

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

/* Table Styles Override */
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

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
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
  max-width: 480px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
  font-size: 1.1rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-light);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Form Styles Reuse */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: var(--text-light);
  font-size: 0.9rem;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 1.2rem;
}

.input-wrapper input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  padding: 10px 10px 10px 40px;
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
}

.input-wrapper input:focus {
  border-color: #f59e0b;
  outline: none;
}

.disabled-input {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02) !important;
}

.eye-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.generate-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
}

.generate-btn:hover:not(:disabled) {
  background: #d97706;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Result Styles */
.result-card {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-weight: 600;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
}

.otp-display {
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 4px;
  color: #10b981;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 0.8rem;
  border: 1px dashed rgba(16, 185, 129, 0.4);
}

.instruction {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 0.4rem;
}

.credential-box {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.8rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-bottom-color: white;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuth } from "../composables/useAuth";

const { user, logout } = useAuth();
const isOpen = ref(false);
const dropdownRef = ref(null);

const initials = computed(() => {
  if (!user.value?.full_name) return "U";
  return user.value.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown);
});
</script>

<template>
  <div class="user-dropdown" ref="dropdownRef">
    <button class="profile-trigger" @click="toggleDropdown">
      <div class="avatar-circle">{{ initials }}</div>
      <div class="user-info">
        <span class="user-name">{{ user?.full_name || "User" }}</span>
        <!-- Optional: <span class="user-role">{{ user?.is_admin ? 'Admin' : 'User' }}</span> -->
      </div>
      <Icon
        icon="solar:alt-arrow-down-linear"
        class="chevron"
        :class="{ rotated: isOpen }"
      />
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">
          <p class="dropdown-name">{{ user?.full_name }}</p>
          <p class="dropdown-email">{{ user?.username }}</p>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item logout" @click="logout">
          <Icon icon="solar:logout-2-bold" class="icon" />
          Logout
        </button>
      </div>
    </transition>
  </div>
</template>


<style scoped>
.user-dropdown {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.profile-trigger:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #4299e1, #667eea);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.user-info {
  text-align: left;
  display: none; /* Hide on small screens if needed, user requested "profile circle and name" */
}

@media (min-width: 768px) {
  .user-info {
    display: block;
  }
}

.user-name {
  display: block;
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 120%;
  right: 0;
  width: 200px;
  background-color: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
  transform-origin: top right;
}

.dropdown-header {
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.02);
}

.dropdown-name {
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
  font-size: 0.95rem;
}

.dropdown-email {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 4px 0 0 0;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-light);
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.dropdown-item.logout {
  color: #ef4444; /* Red color for logout */
}

.dropdown-item.logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.icon {
  width: 18px;
  height: 18px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

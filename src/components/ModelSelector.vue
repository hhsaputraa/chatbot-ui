<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref(null);

const models = [
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 32B',
    description: 'Balanced for general tasks',
    icon: '⚡'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    description: 'High capability & reasoning',
    icon: '🧠'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    description: 'Fast & lightweight',
    icon: '🚀'
  }
];

const selectedModel = computed(() => {
  return models.find(m => m.id === props.modelValue) || models[0];
});

function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function selectModel(modelId) {
  emit('update:modelValue', modelId);
  isOpen.value = false;
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});
</script>

<template>
  <div class="model-selector" ref="dropdownRef">
    <label class="selector-label">AI Model</label>
    
    <div 
      class="selector-trigger" 
      :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
      @click="toggleDropdown"
    >
      <div class="selected-info">
        
        <div class="model-details-compact">
          <span class="model-name">{{ selectedModel.name }}</span>
        </div>
      </div>
      
      <svg 
        class="chevron" 
        :class="{ rotated: isOpen }"
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="options-menu">
        <div 
          v-for="model in models" 
          :key="model.id"
          class="option-item"
          :class="{ 'is-selected': model.id === modelValue }"
          @click="selectModel(model.id)"
        >
          
          <div class="option-content">
            <div class="option-name">
              {{ model.name }}
              <span v-if="model.id === modelValue" class="check-mark">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </div>
            <div class="option-desc">{{ model.description }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.model-selector {
  position: relative;
  width: 100%;
  margin-bottom: 12px;
  font-family: 'Inter', sans-serif;
}

.selector-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  margin-left: 2px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.selector-trigger:hover:not(.is-disabled) {
  border-color: rgba(66, 153, 225, 0.5);
  background-color: rgba(255, 255, 255, 0.03);
}

.selector-trigger.is-open {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.selector-trigger.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.model-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-light);
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.3s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.options-menu {
  position: absolute;
  bottom: 100%; /* Opens upwards by default to avoid being cut off at bottom of sidebar */
  left: 0;
  width: 100%;
  background-color: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 8px; /* Space between trigger and menu */
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  z-index: 50;
  overflow: hidden;
  padding: 4px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.option-item.is-selected {
  background-color: rgba(59, 130, 246, 0.1);
}

.option-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.option-content {
  flex: 1;
}

.option-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 2px;
}

.option-item.is-selected .option-name {
  color: var(--primary-blue);
}

.option-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.check-mark {
  color: var(--primary-blue);
  display: flex;
  align-items: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

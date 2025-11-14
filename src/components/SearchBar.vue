<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <svg
        class="search-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Cari..."
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
      />
      <button
        v-if="searchQuery && searchQuery.length > 0"
        class="clear-search-btn"
        @click="$emit('clear')"
        title="Clear search"
      >
        <svg
          class="clear-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    <div class="search-results-info">
      <span v-if="searchQuery && searchQuery.length > 0">
        Showing {{ filteredCount }} of {{ totalCount }} rows
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: "",
  },
  filteredCount: {
    type: Number,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
})

defineEmits(["update:searchQuery", "clear"])
</script>

<style scoped>
/* Search Container */
.search-container {
  padding: 16px;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  background-color: var(--input-bg);
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.clear-search-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.clear-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.search-results-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-left: 4px;
}
</style>

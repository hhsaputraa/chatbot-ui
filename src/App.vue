<script setup>
import ToastContainer from "./components/ToastContainer.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
</script>

<template>
  <ToastContainer />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
</template>

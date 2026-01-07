import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
    /**
     * Add a new toast notification
     * @param {string} message - The message to display
     * @param {'success' | 'error' | 'info' | 'warning'} type - The type of toast
     * @param {number} duration - Duration in ms before auto-dismiss
     */
    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            message,
            type,
            duration
        };

        toasts.value.push(toast);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    };

    return {
        toasts,
        addToast,
        removeToast
    };
}

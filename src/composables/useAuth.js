import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { encryptField } from '../utils/crypto';

const user = ref(null);
const isLoading = ref(false);
const error = ref(null);

export function useAuth() {
    const router = useRouter();

    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.is_admin === true);

    async function login(username, password) {
        isLoading.value = true;
        error.value = null;

        try {
            // Encrypt sensitive data
            const encryptedUsername = encryptField(username);
            const encryptedPassword = encryptField(password);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: encryptedUsername,
                    password: encryptedPassword
                }),
                credentials: 'include' // Important for cookies
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Fetch user profile immediately after login
            await fetchUser();

            // Redirect handled by component or here
            router.push('/');

            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function register(username, password, fullName, email) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    full_name: fullName,
                    email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function logout() {
        isLoading.value = true;
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            user.value = null;
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUser() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
                credentials: 'include' // Send the auth cookie
            });

            if (response.ok) {
                const data = await response.json();
                // Backend logic: returns { data: { user: ... } }
                if (data.data?.user) {
                    user.value = data.data.user;
                }
            } else {
                user.value = null;
            }
        } catch (err) {
            console.log("Check auth failed", err);
            user.value = null;
        }
    }

    return {
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        error,
        login,
        register,
        logout,
        fetchUser
    };
}

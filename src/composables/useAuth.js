import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { encryptField } from '../utils/crypto';

const user = ref(null);
const isLoading = ref(false);
const error = ref(null);
const hasCheckedAuth = ref(false);

export const ACCOUNT_STATUS = {
    PERFECT: 0,
    PENDING_SETUP: 1,
    FORGOT_PASSWORD: 2,
    BLOCKED: 3
};

export function getAuthHeaders(extraHeaders = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = { ...extraHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export function useAuth() {
    const router = useRouter(); // Note: This may be undefined if called outside setup/component (e.g. in Router Guard)
    
    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.is_admin === true);

    async function login(username, password, shouldRedirect = true) {
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
                // Handle 401 for BLOCKED user if returned by backend
                throw new Error(data.message || 'Login failed');
            }

            if (data.data?.token) {
                localStorage.setItem('auth_token', data.data.token);
            }

            // Fetch user profile immediately after login to get account_status
            await fetchUser();
            
            const status = user.value?.account_status;

            // STATUS CHECK LOGIC
            // 2 = FORGOT_PASSWORD -> Must use OTP. Block standard login.
            if (status === ACCOUNT_STATUS.FORGOT_PASSWORD) {
                await logout();
                throw new Error("Akun dalam proses Reset. Silahkan login melalui menu 'Lupa Password'.");
            }
            
            // 3 = BLOCKED (Defense in depth, though backend should 401)
            if (status === ACCOUNT_STATUS.BLOCKED) {
                await logout();
                throw new Error("Akun anda diblokir. Silahkan hubungi administrator.");
            }

            // Redirect based on status
            // 0 = PERFECT -> Dashboard
            // 1 = PENDING_SETUP -> Change Password
            if (shouldRedirect) {
                if (status === ACCOUNT_STATUS.PENDING_SETUP) {
                    router.push('/change-password');
                } else {
                    router.push('/');
                }
            }

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
                headers: getAuthHeaders(),
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('auth_token');
            user.value = null;
            hasCheckedAuth.value = false;
            isLoading.value = false;
            if (router) {
                router.push('/login');
            }
        }
    }

    async function changePassword(oldPassword, newPassword) {
        isLoading.value = true;
        error.value = null;

        try {
             // Encrypt sensitive data
             const encryptedOldPassword = encryptField(oldPassword);
             const encryptedNewPassword = encryptField(newPassword);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    old_password: encryptedOldPassword,
                    new_password: encryptedNewPassword
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Change password failed');
            }
            
            // On success, backend sets status to PERFECT (0). Update local state.
            if (user.value) {
                user.value.account_status = ACCOUNT_STATUS.PERFECT;
            }

            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUser() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
                headers: getAuthHeaders(),
                credentials: 'include' // Send the auth cookie
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.user) {
                    const userProfile = data.data.user;
                    
                    // Defense: Check if backend says blocked but still returned user
                    if (userProfile.account_status === ACCOUNT_STATUS.BLOCKED) {
                         await logout(); 
                         return;
                    }

                    user.value = userProfile;
                }
            } else {
                user.value = null;
            }
        } catch (err) {
            console.log("Check auth failed", err);
            user.value = null;
        } finally {
            hasCheckedAuth.value = true;
        }
    }

    async function loginOtp(username, otp) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    otp
                }),
                credentials: 'include' // Important for cookies
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login via OTP failed');
            }

            if (data.data?.token) {
                localStorage.setItem('auth_token', data.data.token);
            }

            // Fetch user profile
            await fetchUser();
            
            const status = user.value?.account_status;

            // Redirect logic
            // 1 (PENDING) or 2 (FORGOT) -> Change Password
            if (status === ACCOUNT_STATUS.PENDING_SETUP || status === ACCOUNT_STATUS.FORGOT_PASSWORD) {
                router.push('/change-password');
            } else {
                router.push('/');
            }

            return true;
        } catch (err) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        error,
        hasCheckedAuth,
        login,
        register,
        logout,
        fetchUser,
        changePassword,
        loginOtp
    };
}

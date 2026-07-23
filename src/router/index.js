import { createRouter, createWebHistory } from 'vue-router'
import TestingView from '../views/testing/TestingView.vue'
import ChatView from '../views/Chat/index.vue'
import PdfTestingView from '../views/PdfTesting/index.vue'
import ImproveQueryView from '../views/ImproveQuery/index.vue'
import ImproveKnowledgeView from '../views/ImproveKnowledge/index.vue'
import LoginView from '../views/auth/Login.vue'
import RegisterView from '../views/auth/Register.vue'
import { useAuth, ACCOUNT_STATUS } from '../composables/useAuth'

import ChangePasswordView from '../views/auth/ChangePassword.vue'
import LoginOtpView from '../views/auth/LoginOtp.vue'
import OtpGeneratorView from '../views/admin/OtpGenerator.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { guestOnly: true }
    },
    {
        path: '/login-otp',
        name: 'LoginOtp',
        component: LoginOtpView,
        meta: { guestOnly: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView,
        meta: { guestOnly: true }
    },
    {
        path: '/change-password',
        name: 'ChangePassword',
        component: ChangePasswordView,
        meta: { requiresAuth: true }
    },
    {
        path: '/',
        name: 'Chat',
        component: ChatView,
        meta: { requiresAuth: true }
    },
    {
        path: '/testing',
        name: 'Testing',
        component: TestingView,
        meta: { requiresAuth: true }
    },
    {
        path: '/pdftesting',
        name: 'pdftesting',
        component: PdfTestingView,
        meta: { requiresAuth: true }
    },
    {
        path: '/improve_query',
        name: 'ImproveQuery',
        component: ImproveQueryView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/improve_knowledge',
        name: 'ImproveKnowledge',
        component: ImproveKnowledgeView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/otp',
        name: 'OtpGenerator',
        component: OtpGeneratorView,
        meta: { requiresAuth: true, requiresAdmin: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, isAdmin, fetchUser, user, hasCheckedAuth } = useAuth();

    // Attempt to fetch user profile if no user data is present and we haven't checked yet
    // This restores the session on page reload
    if (!user.value && !hasCheckedAuth.value) {
        await fetchUser();
    }

    if (to.meta.requiresAuth && !isAuthenticated.value) {
        next('/login');
    } else if (to.meta.guestOnly && isAuthenticated.value) {
        next('/');
    } else if (isAuthenticated.value) {
        const status = user.value?.account_status;
        
        // Enforce Password Change for PENDING(1) or FORGOT(2)
        // Allow logout (which usually redirects to login) or API calls
        // But for route navigation:
        if ((status === ACCOUNT_STATUS.PENDING_SETUP || status === ACCOUNT_STATUS.FORGOT_PASSWORD) && to.path !== '/change-password') {
             next('/change-password');
             return;
        }

        // Admin Check
        if (to.meta.requiresAdmin && !isAdmin.value) {
            next('/');
            return;
        }

        next();
    } else {
        next();
    }
});

export default router

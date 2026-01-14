import { createRouter, createWebHistory } from 'vue-router'
import TestingView from '../views/testing/TestingView.vue'
import ChatView from '../views/Chat/index.vue'
import PdfTestingView from '../views/PdfTesting/index.vue'
import ImproveQueryView from '../views/ImproveQuery/index.vue'
import ImproveKnowledgeView from '../views/ImproveKnowledge/index.vue'
import LoginView from '../views/auth/Login.vue'
import RegisterView from '../views/auth/Register.vue'
import { useAuth } from '../composables/useAuth'

import ChangePasswordView from '../views/auth/ChangePassword.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
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
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, isAdmin, fetchUser, user } = useAuth();

    // Attempt to fetch user profile if no user data is present
    // This restores the session on page reload
    if (!user.value) {
        await fetchUser();
    }

    if (to.meta.requiresAuth && !isAuthenticated.value) {
        next('/login');
    } else if (to.meta.guestOnly && isAuthenticated.value) {
        next('/');
    } else if (isAuthenticated.value && user.value?.must_change_password && to.path !== '/change-password' && to.path !== '/login') {
        // Enforce password change if flag is set, allowing only login (for logout) or change-password
        next('/change-password');
    } else if (isAuthenticated.value && !user.value?.must_change_password && to.path === '/change-password') {
        // Optional: prevent accessing change-password if not required? 
        // For now, let's allow it so users can change it voluntarily if we add a link later.
        // But if strict "Force Change" flow, user usually doesn't go there unless forced.
        next();
    } else if (to.meta.requiresAdmin && !isAdmin.value) {
        // Redirect non-admins to home if they try to access admin routes
        next('/');
    } else {
        next();
    }
});

export default router

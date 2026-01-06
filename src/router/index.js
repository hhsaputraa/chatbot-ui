import { createRouter, createWebHistory } from 'vue-router'
import TestingView from '../views/testing/TestingView.vue'
import ChatView from '../views/Chat/index.vue'
import PdfTestingView from '../views/PdfTesting/index.vue'
import ImproveQueryView from '../views/ImproveQuery/index.vue'
import ImproveKnowledgeView from '../views/ImproveKnowledge/index.vue'
import LoginView from '../views/auth/Login.vue'
import RegisterView from '../views/auth/Register.vue'
import { useAuth } from '../composables/useAuth'

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
        meta: { requiresAuth: true }
    },
    {
        path: '/improve_knowledge',
        name: 'ImproveKnowledge',
        component: ImproveKnowledgeView,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, fetchUser, user } = useAuth();

    // Attempt to fetch user profile if no user data is present
    // This restores the session on page reload
    if (!user.value) {
        await fetchUser();
    }

    if (to.meta.requiresAuth && !isAuthenticated.value) {
        next('/login');
    } else if (to.meta.guestOnly && isAuthenticated.value) {
        next('/');
    } else {
        next();
    }
});

export default router

import { createRouter, createWebHistory } from 'vue-router'
import TestingView from '../views/testing/TestingView.vue'
import ChatView from '../views/Chat/index.vue'
import PdfTestingView from '../views/PdfTesting/index.vue'
import ImproveQueryView from '../views/ImproveQuery/index.vue'
import ImproveKnowledgeView from '../views/ImproveKnowledge/index.vue'
import LoginView from '../views/Auth/Login.vue'
import RegisterView from '../views/Auth/Register.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { requiresGuest: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView,
        meta: { requiresGuest: true }
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

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('jwt_token')
    const isAuthenticated = !!token

    // Check if route requires authentication
    if (to.meta.requiresAuth && !isAuthenticated) {
        // Redirect to login with return URL
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
    }
    // Check if route requires guest (login/register pages)
    else if (to.meta.requiresGuest && isAuthenticated) {
        // Redirect to home if already logged in
        next('/')
    }
    // Allow navigation
    else {
        next()
    }
})

export default router
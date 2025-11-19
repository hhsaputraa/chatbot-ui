import {createRouter, createWebHistory } from 'vue-router'
import TestingView from '../views/testing/TestingView.vue'
import ChatView from '../views/Chat/index.vue'
import PdfTestingView from '../views/PdfTesting/index.vue'
import ImproveQueryView from '../views/ImproveQuery/index.vue'

const routes = [
    {
        path: '/',
        name: 'Chat',
        component: ChatView
    },
    {
        path: '/testing',
        name: 'Testing',
        component: TestingView
    },
    {
        path: '/pdftesting',
        name: 'pdftesting',
        component: PdfTestingView
    },
    {
        path: '/improve_query',
        name: 'ImproveQuery',
        component: ImproveQueryView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
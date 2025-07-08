import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/charts'
    },
    {
      path: '/charts',
      name: 'charts',
      component: () => import('../views/ChartsView.vue')
    },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableView.vue')
    }
  ]
})

export default router
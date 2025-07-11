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
      component: () => import('../views/ChartsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Protección de rutas
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('user')
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // Solo continuar a la ruta, el modal se mostrará automáticamente
      next()
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
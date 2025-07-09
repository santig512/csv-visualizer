<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginForm from '@/components/LoginForm.vue'

// Estados de autenticación
const isLoggedIn = ref(false)
const currentUser = ref('')
const showLoginModal = ref(false)

// Estado de navegación
const currentView = ref('charts') // 'charts' o 'table'
const sidebarCollapsed = ref(false)

// Verificar si hay sesión guardada al cargar la app
onMounted(() => {
  const savedUser = localStorage.getItem('csvVisualizerUser')
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser)
      currentUser.value = userData.username
      isLoggedIn.value = true
      console.log('Sesión restaurada:', userData.username)
    } catch (error) {
      console.error('Error al restaurar sesión:', error)
      localStorage.removeItem('csvVisualizerUser')
    }
  }
})

// Manejar login exitoso
const handleLoginSuccess = (userData: { username: string }) => {
  isLoggedIn.value = true
  currentUser.value = userData.username
  showLoginModal.value = false
  
  // Guardar en localStorage
  localStorage.setItem('csvVisualizerUser', JSON.stringify(userData))
  
  console.log('Usuario logueado:', userData.username)
}

// Cerrar sesión
const handleLogout = () => {
  isLoggedIn.value = false
  currentUser.value = ''
  
  // Limpiar localStorage
  localStorage.removeItem('csvVisualizerUser')
  
  console.log('Sesión cerrada')
}

// Cambiar vista
const setView = (view: string) => {
  currentView.value = view
  console.log('Vista cambiada a:', view)
}

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div id="app">
    <!-- NAVBAR SUPERIOR -->
    <nav class="navbar">
      <div class="nav-left">
        <!-- Botón hamburguesa para sidebar -->
        <button 
          v-if="isLoggedIn" 
          class="sidebar-toggle" 
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h2>CSV Visualizer</h2>
      </div>
      
      <!-- SECCIÓN DE AUTENTICACIÓN -->
      <div class="nav-auth">
        <!-- Si NO está logueado -->
        <button 
          v-if="!isLoggedIn" 
          class="login-btn" 
          @click="showLoginModal = true"
        >
          🔐 Iniciar Sesión
        </button>
        
        <!-- Si YA está logueado -->
        <div v-else class="user-menu">
          <span class="welcome-text">¡Hola, {{ currentUser }}!</span>
          <button class="logout-btn" @click="handleLogout">
            🚪 Salir
          </button>
        </div>
      </div>
    </nav>

    <div class="app-layout">
      <!-- BARRA LATERAL IZQUIERDA -->
      <aside 
        v-if="isLoggedIn" 
        class="sidebar" 
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      >
        <div class="sidebar-content">
          
          <!-- TÍTULO DE LA SIDEBAR -->
          <div class="sidebar-header">
            <h3 v-if="!sidebarCollapsed">Navegación</h3>
            <span v-else class="sidebar-icon">📱</span>
          </div>
          
          <!-- BOTONES DE NAVEGACIÓN -->
          <nav class="sidebar-nav">
            
            <!-- Botón Gráficos -->
            <button 
              class="sidebar-btn" 
              :class="{ active: currentView === 'charts' }"
              @click="setView('charts')"
            >
              <span class="btn-icon">📈</span>
              <span v-if="!sidebarCollapsed" class="btn-text">Gráficos</span>
            </button>
            
            <!-- Botón Tabla -->
            <button 
              class="sidebar-btn" 
              :class="{ active: currentView === 'table' }"
              @click="setView('table')"
            >
              <span class="btn-icon">📊</span>
              <span v-if="!sidebarCollapsed" class="btn-text">Tabla</span>
            </button>
            
            <!-- Separador -->
            <div class="sidebar-separator"></div>
            
            <!-- Botón Configuración (ejemplo de funcionalidad futura) -->
            <button class="sidebar-btn sidebar-btn-secondary">
              <span class="btn-icon">⚙️</span>
              <span v-if="!sidebarCollapsed" class="btn-text">Configuración</span>
            </button>
            
          </nav>
          
          <!-- PIE DE SIDEBAR -->
          <div class="sidebar-footer">
            <div v-if="!sidebarCollapsed" class="app-info">
              <small>CSV Visualizer v1.0</small>
            </div>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <main class="main-content" :class="{ 
        'main-with-sidebar': isLoggedIn && !sidebarCollapsed,
        'main-with-sidebar-collapsed': isLoggedIn && sidebarCollapsed,
        'main-full': !isLoggedIn
      }">
        
        <!-- Mostrar mensaje si no está logueado -->
        <div v-if="!isLoggedIn" class="login-required">
          <div class="login-message">
            <h2>🔒 Acceso Restringido</h2>
            <p>Debes iniciar sesión para usar CSV Visualizer</p>
            <button class="login-prompt-btn" @click="showLoginModal = true">
              Iniciar Sesión
            </button>
          </div>
        </div>
        
        <!-- Mostrar la aplicación si está logueado -->
        <div v-else class="app-content">
          
          <!-- HEADER DEL CONTENIDO -->
          <div class="content-header">
            <h1 v-if="currentView === 'charts'">📈 Visualización de Gráficos</h1>
            <h1 v-if="currentView === 'table'">📊 Vista de Tabla</h1>
            <p class="content-subtitle">
              <span v-if="currentView === 'charts'">Crea y visualiza gráficos interactivos de tus datos CSV</span>
              <span v-if="currentView === 'table'">Explora y analiza tus datos en formato tabular</span>
            </p>
          </div>
          
          <!-- CONTENIDO DINÁMICO -->
          <div class="view-content">
            <div v-if="currentView === 'charts'" class="charts-view">
              <router-view />
              <!-- Aquí irían tus componentes de gráficos -->
            </div>
            
            <div v-if="currentView === 'table'" class="table-view">
              <div class="placeholder-content">
                <h3>🚧 Vista de Tabla</h3>
                <p>Esta sección estará disponible próximamente.</p>
                <p>Aquí podrás ver y editar tus datos CSV en formato de tabla.</p>
              </div>
              <!-- Aquí irían tus componentes de tabla -->
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <!-- MODAL DE LOGIN -->
    <LoginForm 
      :is-visible="showLoginModal"
      @close="showLoginModal = false"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
/* LAYOUT PRINCIPAL */
#app {
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* NAVBAR SUPERIOR */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1001;
  height: 60px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-left h2 {
  margin: 0;
  color: white;
  font-size: 1.4rem;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* SECCIÓN DE AUTENTICACIÓN */
.nav-auth {
  display: flex;
  align-items: center;
}

.login-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
}

.login-btn:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  color: #ecf0f1;
  font-weight: 500;
  font-size: 0.9rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}

/* LAYOUT CON SIDEBAR */
.app-layout {
  display: flex;
  padding-top: 60px;
  min-height: calc(100vh - 60px);
}

/* BARRA LATERAL */
.sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  width: 400px;
  height: calc(100vh - 60px);
  background: white;
  border-right: 1px solid #e9ecef;
  box-shadow: 2px 0 10px rgba(0,0,0,0.05);
  transition: width 0.3s ease;
  z-index: 1000;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem 0;
}

.sidebar-header {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.sidebar-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.sidebar-icon {
  font-size: 1.5rem;
}

/* NAVEGACIÓN DE SIDEBAR */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  width: 100%;
  color: #495057;
  font-size: 0.95rem;
}

.sidebar-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.sidebar-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.sidebar-btn-secondary {
  color: #6c757d;
  margin-top: auto;
}

.sidebar-btn-secondary:hover {
  background: #f1f3f4;
  color: #495057;
}

.btn-icon {
  font-size: 1.2rem;
  min-width: 20px;
}

.btn-text {
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-separator {
  height: 1px;
  background: #e9ecef;
  margin: 1rem 0;
}

/* PIE DE SIDEBAR */
.sidebar-footer {
  padding: 0 1.5rem;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.app-info {
  text-align: center;
  color: #6c757d;
}

/* CONTENIDO PRINCIPAL */
.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 60px);
}

.main-with-sidebar {
  margin-left: 250px;
}

.main-with-sidebar-collapsed {
  margin-left: 70px;
}

.main-full {
  margin-left: 0;
}

/* MENSAJE DE LOGIN REQUERIDO */
.login-required {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

.login-message {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  max-width: 500px;
}

.login-message h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.login-message p {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.login-prompt-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.login-prompt-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #1e6091 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

/* CONTENIDO DE LA APP */
.app-content {
  padding: 2rem;
  min-height: calc(100vh - 120px);
}

.content-header {
  margin-bottom: 2rem;
}

.content-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
}

.content-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
}

/* VISTAS DE CONTENIDO */
.view-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  min-height: 400px;
}

.placeholder-content {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.placeholder-content h3 {
  color: #495057;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.placeholder-content p {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }
  
  .nav-left h2 {
    font-size: 1.2rem;
  }
  
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0 !important;
  }
  
  .app-content {
    padding: 1rem;
  }
  
  .content-header h1 {
    font-size: 1.5rem;
  }
  
  .view-content {
    padding: 1rem;
  }
}
</style>

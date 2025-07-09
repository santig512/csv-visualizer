<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import LoginForm from '@/components/LoginForm.vue'
import LineChart from '@/components/LineChart.vue'
import HourRangerFilter from '@/components/HourRangerFilter.vue'
import TableView from '@/views/TableView.vue'
import { useCSVStore } from '@/stores/csvStore'
import { parseCSV } from '@/utils/csvParser'

// CSV Store
const csvStore = useCSVStore()

// Estados de autenticación
const isLoggedIn = ref(false)
const currentUser = ref('')
const showLoginModal = ref(false)

// Estado de navegación
const currentView = ref('charts') // 'charts' o 'table'
const sidebarCollapsed = ref(false)

// Estados de archivos
const uploadedFiles = ref<File[]>([])
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Estados para tabla
const filteredData = ref<Record<string, any>[]>([])
const showFullTable = ref(true)

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
  
  // Limpiar archivos al cerrar sesión
  uploadedFiles.value = []
  selectedFile.value = null
  filteredData.value = []
  showFullTable.value = true
  
  csvStore.clearData()
  
  // Limpiar localStorage
  localStorage.removeItem('csvVisualizerUser')
  
  console.log('Sesión cerrada')
}

// Cambiar vista
const setView = (view: string) => {
  if (!selectedFile.value) {
    console.warn('No hay archivo seleccionado')
    return
  }
  currentView.value = view
  console.log('Vista cambiada a:', view)
}

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// FUNCIONES DE MANEJO DE ARCHIVOS

// Función para abrir el selector de archivos
const openFileSelector = () => {
  console.log('Intentando abrir selector de archivos...')
  console.log('fileInput.value:', fileInput.value)
  
  if (fileInput.value) {
    console.log('Abriendo selector de archivos')
    fileInput.value.click()
  } else {
    console.error('No se encontró la referencia al input de archivo')
  }
}

// Manejar subida de archivos
const handleFileUpload = async (event: Event) => {
  console.log('Evento de subida de archivo disparado')
  const target = event.target as HTMLInputElement
  const files = target.files
  
  console.log('Archivos seleccionados:', files?.length || 0)
  
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      console.log('Procesando archivo:', file.name, 'Tamaño:', file.size)
      
      // Validar que sea un archivo CSV
      if (!file.name.toLowerCase().endsWith('.csv')) {
        console.error('Archivo no es CSV:', file.name)
        alert('Por favor selecciona solo archivos CSV (.csv)')
        continue
      }
      
      // Verificar si el archivo ya existe
      const existingFile = uploadedFiles.value.find(f => 
        f.name === file.name && f.size === file.size
      )
      
      if (!existingFile) {
        uploadedFiles.value.push(file)
        console.log('Archivo agregado a la lista:', file.name)
        
        // Si es el primer archivo, seleccionarlo automáticamente
        if (uploadedFiles.value.length === 1) {
          console.log('Seleccionando primer archivo automáticamente')
          await selectFile(file)
        }
      } else {
        console.warn('El archivo ya está cargado:', file.name)
        alert(`El archivo "${file.name}" ya está cargado`)
      }
    }
    
    // Limpiar el input para permitir subir el mismo archivo otra vez si es necesario
    target.value = ''
    console.log('Input de archivo limpiado')
  } else {
    console.log('No se seleccionaron archivos')
  }
}

// Seleccionar archivo y procesarlo
const selectFile = async (file: File) => {
  console.log('=== INICIANDO SELECCIÓN DE ARCHIVO ===')
  console.log('Archivo:', file.name, 'Tamaño:', file.size)
  
  selectedFile.value = file
  
  // LIMPIAR DATOS FILTRADOS AL CAMBIAR DE ARCHIVO
  filteredData.value = []
  showFullTable.value = true
  
  // Procesar el CSV
  try {
    csvStore.setLoading(true)
    csvStore.setError(null)
    
    console.log('Leyendo contenido del archivo...')
    const text = await file.text()
    console.log('Archivo leído, tamaño del texto:', text.length)
    
    console.log('Parseando CSV...')
    const csvData = parseCSV(text)
    console.log('CSV parseado exitosamente:', {
      headers: csvData.headers.length,
      rows: csvData.rows.length,
      firstHeader: csvData.headers[0],
      firstRow: csvData.rows[0]
    })
    
    // Usar addCSVFile del store
    csvStore.addCSVFile(csvData, file.name)
    console.log('Datos guardados en el store')
    
    // Si no hay vista seleccionada, ir a gráficos por defecto
    if (!currentView.value) {
      currentView.value = 'charts'
      console.log('Vista establecida a charts por defecto')
    }
    
    // Forzar actualización
    await nextTick()
    console.log('=== ARCHIVO PROCESADO EXITOSAMENTE ===')
    
  } catch (error: any) {
    console.error('=== ERROR AL PROCESAR ARCHIVO ===')
    console.error('Error:', error)
    csvStore.setError(`Error al procesar el archivo: ${error.message}`)
    alert(`Error al procesar el archivo: ${error.message}`)
  } finally {
    csvStore.setLoading(false)
  }
}

// Eliminar archivo
const removeFile = async (index: number) => {
  console.log('Eliminando archivo en índice:', index)
  const fileToRemove = uploadedFiles.value[index]
  
  // Si el archivo a eliminar es el seleccionado, limpiar selección
  if (selectedFile.value === fileToRemove) {
    selectedFile.value = null
    filteredData.value = []
    showFullTable.value = true
    csvStore.clearData()
    
    // Si hay otros archivos, seleccionar el primero disponible
    if (uploadedFiles.value.length > 1) {
      const remainingFiles = uploadedFiles.value.filter((_, i) => i !== index)
      if (remainingFiles.length > 0) {
        await selectFile(remainingFiles[0])
      }
    }
  }
  
  // Eliminar el archivo de la lista
  uploadedFiles.value.splice(index, 1)
  console.log('Archivo eliminado:', fileToRemove.name)
}

// Formatear tamaño de archivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Manejar cambio de filtro de horas
const handleFilterChange = (filtered: Record<string, any>[]) => {
  console.log('Filtro aplicado, registros:', filtered.length)
  filteredData.value = filtered
  showFullTable.value = filtered.length === (csvStore.data?.rows.length || 0)
}
</script>

<template>
  <div id="app">
    <!-- NAVBAR SUPERIOR -->
    <nav class="navbar">
      <div class="nav-left">
        <button 
          v-if="isLoggedIn" 
          class="sidebar-toggle" 
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h2>CSV Visualizer</h2>
      </div>
      
      <div class="nav-auth">
        <button 
          v-if="!isLoggedIn" 
          class="login-btn" 
          @click="showLoginModal = true"
        >
          🔐 Iniciar Sesión
        </button>
        
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
          
          <div class="sidebar-header">
            <h3 v-if="!sidebarCollapsed">Panel de Control</h3>
            <span v-else class="sidebar-icon">📱</span>
          </div>
          
          <!-- SECCIÓN DE ARCHIVOS -->
          <div class="sidebar-section">
            <h4 v-if="!sidebarCollapsed" class="section-title">📁 Archivos</h4>
            
            <div class="file-upload-section">
              <input 
                ref="fileInput"
                type="file" 
                accept=".csv"
                @change="handleFileUpload"
                style="display: none"
                multiple
              />
              
              <button 
                class="sidebar-btn file-btn" 
                @click="openFileSelector"
                type="button"
              >
                <span class="btn-icon">📤</span>
                <span v-if="!sidebarCollapsed" class="btn-text">Subir CSV</span>
              </button>
            </div>
            
            <div v-if="uploadedFiles.length > 0" class="uploaded-files">
              <h5 v-if="!sidebarCollapsed" class="files-title">Archivos cargados:</h5>
              
              <div 
                v-for="(file, index) in uploadedFiles" 
                :key="index"
                class="file-item"
                :class="{ active: selectedFile === file }"
                @click="selectFile(file)"
              >
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <div v-if="!sidebarCollapsed" class="file-details">
                    <span class="file-name">{{ file.name }}</span>
                    <small class="file-size">{{ formatFileSize(file.size) }}</small>
                  </div>
                </div>
                <button 
                  v-if="!sidebarCollapsed"
                  class="file-delete-btn" 
                  @click.stop="removeFile(index)"
                  title="Eliminar archivo"
                  type="button"
                >
                  ❌
                </button>
              </div>
            </div>
            
            <div v-else-if="!sidebarCollapsed" class="no-files-message">
              <small>No hay archivos cargados</small>
            </div>
          </div>
          
          <div class="sidebar-separator"></div>
          
          <!-- SECCIÓN DE NAVEGACIÓN -->
          <div class="sidebar-section">
            <h4 v-if="!sidebarCollapsed" class="section-title">📊 Visualización</h4>
            
            <nav class="sidebar-nav">
              <button 
                class="sidebar-btn" 
                :class="{ active: currentView === 'charts' }"
                @click="setView('charts')"
                :disabled="!selectedFile"
                type="button"
              >
                <span class="btn-icon">📈</span>
                <span v-if="!sidebarCollapsed" class="btn-text">Gráficos</span>
              </button>
              
              <button 
                class="sidebar-btn" 
                :class="{ active: currentView === 'table' }"
                @click="setView('table')"
                :disabled="!selectedFile"
                type="button"
              >
                <span class="btn-icon">📊</span>
                <span v-if="!sidebarCollapsed" class="btn-text">Tabla</span>
              </button>
            </nav>
          </div>
          
          <div class="sidebar-separator"></div>
          
          <div class="sidebar-section">
            <button class="sidebar-btn sidebar-btn-secondary" type="button">
              <span class="btn-icon">⚙️</span>
              <span v-if="!sidebarCollapsed" class="btn-text">Configuración</span>
            </button>
          </div>
          
          <div class="sidebar-footer">
            <div v-if="!sidebarCollapsed" class="app-info">
              <small>CSV Visualizer v1.0</small>
              <div v-if="selectedFile" class="current-file-info">
                <small>📄 {{ selectedFile.name }}</small>
              </div>
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
        
        <div v-if="!isLoggedIn" class="login-required">
          <div class="login-message">
            <h2>🔒 Acceso Restringido</h2>
            <p>Debes iniciar sesión para usar CSV Visualizer</p>
            <button class="login-prompt-btn" @click="showLoginModal = true" type="button">
              Iniciar Sesión
            </button>
          </div>
        </div>
        
        <div v-else class="app-content">
          
          <div v-if="!selectedFile" class="no-file-selected">
            <div class="empty-state">
              <h2>📁 No hay archivo seleccionado</h2>
              <p>Sube un archivo CSV desde la barra lateral para comenzar</p>
              <div class="upload-instructions">
                <div class="instruction">
                  <span class="step">1.</span>
                  <span>Haz clic en "📤 Subir CSV" en la barra lateral</span>
                </div>
                <div class="instruction">
                  <span class="step">2.</span>
                  <span>Selecciona tu archivo CSV</span>
                </div>
                <div class="instruction">
                  <span class="step">3.</span>
                  <span>Haz clic en el archivo para seleccionarlo</span>
                </div>
                <div class="instruction">
                  <span class="step">4.</span>
                  <span>¡Comienza a visualizar tus datos!</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else>
            <div class="content-header">
              <h1 v-if="currentView === 'charts'">📈 Visualización de Gráficos</h1>
              <h1 v-if="currentView === 'table'">📊 Vista de Tabla</h1>
              <p class="content-subtitle">
                <span v-if="currentView === 'charts'">Crea y visualiza gráficos interactivos de tus datos CSV</span>
                <span v-if="currentView === 'table'">Explora y analiza tus datos en formato tabular con filtros</span>
              </p>
              <div class="file-indicator">
                <span class="current-file-badge">
                  📄 {{ selectedFile.name }} 
                  <small>({{ formatFileSize(selectedFile.size) }})</small>
                </span>
              </div>
            </div>
            
            <div class="view-content">
              
              <!-- VISTA DE GRÁFICOS -->
              <div v-if="currentView === 'charts'" class="charts-view">
                <HourRangerFilter @filter-change="handleFilterChange" />
                <LineChart 
                  title="Visualizador de Gráficos CSV" 
                  :filteredData="filteredData"
                />
              </div>
              
              <!-- VISTA DE TABLA - SOLO USAR TableView SIN FILTROS -->
              <div v-if="currentView === 'table'" class="table-view">
                <TableView />
              </div>
              
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

<!-- ... mantén todos los estilos existentes ... -->
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
  width: 300px;
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

/* SECCIONES DE LA SIDEBAR */
.sidebar-section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 1rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* SECCIÓN DE ARCHIVOS */
.file-upload-section {
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.file-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: 2px solid transparent;
}

.file-btn:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

/* ARCHIVOS CARGADOS */
.uploaded-files {
  padding: 0 1rem;
}

.files-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: #495057;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-item:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.file-item.active {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-color: #0056b3;
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.7rem;
  opacity: 0.8;
}

.file-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: all 0.3s;
  flex-shrink: 0;
}

.file-delete-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

.no-files-message {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* NAVEGACIÓN DE SIDEBAR */
.sidebar-nav {
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

.sidebar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa !important;
  color: #6c757d !important;
  box-shadow: none !important;
  transform: none !important;
}

.sidebar-btn-secondary {
  color: #6c757d;
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
  margin-top: auto;
}

.app-info {
  text-align: center;
  color: #6c757d;
}

.current-file-info {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  color: #495057;
}

/* CONTENIDO PRINCIPAL */
.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 60px);
}

.main-with-sidebar {
  margin-left: 300px;
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

/* ESTADO SIN ARCHIVO SELECCIONADO */
.no-file-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

.empty-state {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  max-width: 600px;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.empty-state p {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.upload-instructions {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.instruction {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.step {
  background: #3498db;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  flex-shrink: 0;
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

.file-indicator {
  margin-top: 1rem;
}

.current-file-badge {
  display: inline-block;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

/* VISTAS DE CONTENIDO */
.view-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  min-height: 400px;
}

.charts-view,
.table-view {
  width: 100%;
  min-height: 600px;
}

.charts-view {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-view {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

/* ESTILOS ADICIONALES PARA TABLA DE RESULTADOS */
.filtered-results,
.full-table {
  margin-top: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.table-info p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.table-wrapper {
  max-height: 500px;
  overflow: auto;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.results-table th {
  background: #2c3e50;
  color: white;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.results-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f3f4;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-table tr:hover {
  background: #f8f9fa;
}

.showing-info {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 0.5rem;
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
  
  .file-item {
    padding: 0.5rem;
  }
  
  .file-name {
    font-size: 0.8rem;
  }
  
  .file-size {
    font-size: 0.65rem;
  }
  
  .empty-state {
    margin: 1rem;
    padding: 2rem;
  }
  
  .instruction {
    padding: 0.75rem;
  }
}
</style>

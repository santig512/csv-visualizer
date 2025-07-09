<template>
  <!-- OVERLAY DEL MODAL -->
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    
    <!-- CONTENIDO DEL MODAL -->
    <div class="modal-content" @click.stop>
      
      <!-- BOTÓN CERRAR -->
      <button class="close-button" @click="closeModal">×</button>
      
      <!-- HEADER DEL LOGIN -->
      <div class="login-header">
        <h2>CSV Visualizer</h2>
        <p>Inicia sesión para acceder</p>
      </div>

      <!-- FORMULARIO -->
      <form @submit.prevent="handleLogin" class="login-form">
        
        <div class="form-group">
          <label>Usuario:</label>
          <input 
            type="text" 
            placeholder="Ingresa tu usuario"
            v-model="username"
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Contraseña:</label>
          <input 
            type="password"
            placeholder="Ingresa tu contraseña"
            v-model="password"
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <!-- MENSAJE DE ERROR -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- BOTÓN LOGIN -->
        <button 
          type="submit"
          :disabled="!isFormValid || isLoading"
          class="login-button"
        >
          <span v-if="isLoading">Cargando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
      
      <!-- CREDENCIALES DE PRUEBA -->
      <div class="test-credentials">
        <small>
          <strong>Credenciales de prueba:</strong><br>
          Usuario: <code>admin</code> | Contraseña: <code>admin123</code>
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps<{
  isVisible: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  loginSuccess: [userData: { username: string }]
}>()

// Variables reactivas
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Computed
const isFormValid = computed(() => {
  return username.value.trim() !== '' && password.value.trim() !== ''
})

// Funciones
const handleLogin = async () => {
  console.log('Intentando hacer login...')
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // Simular llamada al servidor
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (username.value === 'admin' && password.value === 'admin123') {
      console.log('Login exitoso!')
      
      // Emitir evento de éxito
      emit('loginSuccess', { username: username.value })
      
      // Cerrar modal y limpiar formulario
      closeModal()
      resetForm()
      
    } else {
      throw new Error('Usuario o contraseña incorrectos')
    }
    
  } catch (error: any) {
    errorMessage.value = error.message
    console.log('Error de login:', error.message)
    
  } finally {
    isLoading.value = false
  }
}

const clearError = () => {
  errorMessage.value = ''
}

const closeModal = () => {
  emit('close')
}

const resetForm = () => {
  username.value = ''
  password.value = ''
  errorMessage.value = ''
  isLoading.value = false
}

// Limpiar formulario cuando se cierra el modal
watch(() => props.isVisible, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
/* OVERLAY DEL MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* CONTENIDO DEL MODAL */
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* BOTÓN CERRAR */
.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-button:hover {
  background: #f0f0f0;
  color: #333;
}

/* HEADER */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.login-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

/* FORMULARIO */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 0.5rem;
}

.form-group input {
  padding: 1rem;
  border: 2px solid #e0e6ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background-color: #f8f9fa;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  background-color: white;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* MENSAJE DE ERROR */
.error-message {
  background: #fee;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

/* BOTÓN LOGIN */
.login-button {
  padding: 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 50px;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #1e6091 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* CREDENCIALES DE PRUEBA */
.test-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.test-credentials small {
  color: #6c757d;
  line-height: 1.5;
}

.test-credentials code {
  background: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #495057;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .login-header h2 {
    font-size: 1.5rem;
  }
  
  .form-group input,
  .login-button {
    padding: 0.875rem;
  }
}
</style>
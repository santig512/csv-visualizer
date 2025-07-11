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

      <!-- BOTÓN DE REGISTRO -->
      <div class="register-section">
        <p>¿No tienes una cuenta?</p>
        <button 
          type="button" 
          class="register-button"
          @click="handleSwitchToRegister"
        >
          Crear cuenta nueva
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL DE REGISTRO -->
  <div v-if="showRegisterModal" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <button class="close-button" @click="closeRegisterModal">×</button>
      
      <div class="register-header">
        <h2>Crear Cuenta</h2>
        <p>Regístrate para acceder a CSV Visualizer</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label>Nombre completo:</label>
          <input 
            type="text" 
            placeholder="Ingresa tu nombre"
            v-model="fullName"
            :disabled="isRegistering"
          />
        </div>

        <div class="form-group">
          <label>Usuario:</label>
          <input 
            type="text" 
            placeholder="Elige un nombre de usuario"
            v-model="regUsername"
            :disabled="isRegistering"
          />
        </div>

        <div class="form-group">
          <label>Correo electrónico:</label>
          <input 
            type="email" 
            placeholder="tu@email.com"
            v-model="email"
            :disabled="isRegistering"
          />
        </div>

        <div class="form-group">
          <label>Contraseña:</label>
          <input 
            type="password"
            placeholder="Mínimo 6 caracteres"
            v-model="regPassword"
            :disabled="isRegistering"
          />
        </div>

        <div v-if="registerError" class="error-message">
          {{ registerError }}
        </div>

        <div v-if="registerSuccess" class="success-message">
          {{ registerSuccess }}
        </div>

        <button 
          type="submit"
          :disabled="!isRegisterFormValid || isRegistering"
          class="register-submit-button"
        >
          <span v-if="isRegistering">Creando cuenta...</span>
          <span v-else>Crear cuenta</span>
        </button>
      </form>

      <div class="login-section">
        <p>¿Ya tienes una cuenta?</p>
        <button 
          type="button" 
          class="back-to-login-button"
          @click="backToLogin"
        >
          Iniciar sesión
        </button>
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

// Variables reactivas para login
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Variables reactivas para registro
const showRegisterModal = ref(false)
const fullName = ref('')
const regUsername = ref('')
const email = ref('')
const regPassword = ref('')
const isRegistering = ref(false)
const registerError = ref('')
const registerSuccess = ref('')

// Computed
const isFormValid = computed(() => {
  return username.value.trim() !== '' && password.value.trim() !== ''
})

const isRegisterFormValid = computed(() => {
  return fullName.value.trim() !== '' &&
         regUsername.value.trim() !== '' &&
         email.value.trim() !== '' &&
         regPassword.value.length >= 6
})

// Funciones de login
const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Verificar credenciales (incluyendo usuarios registrados)
    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const userExists = storedUsers.find((user: any) => 
      user.username === username.value && user.password === password.value
    )
    
    if (username.value === 'admin' && password.value === 'admin123' || userExists) {
      emit('loginSuccess', { username: username.value })
      closeModal()
      resetForms()
    } else {
      throw new Error('Usuario o contraseña incorrectos')
    }
    
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

// Funciones de registro
const handleRegister = async () => {
  if (!isRegisterFormValid.value) {
    registerError.value = 'Por favor completa todos los campos correctamente'
    return
  }

  registerError.value = ''
  registerSuccess.value = ''
  isRegistering.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const userExists = storedUsers.find((user: any) => 
      user.username === regUsername.value || user.email === email.value
    )
    
    if (userExists) {
      throw new Error('El usuario o email ya está registrado')
    }
    
    const newUser = {
      fullName: fullName.value,
      username: regUsername.value,
      email: email.value,
      password: regPassword.value,
      createdAt: new Date().toISOString()
    }
    
    storedUsers.push(newUser)
    localStorage.setItem('registeredUsers', JSON.stringify(storedUsers))
    
    registerSuccess.value = '¡Cuenta creada exitosamente! Redirigiendo al login...'
    
    setTimeout(() => {
      backToLogin()
    }, 2000)
    
  } catch (error: any) {
    registerError.value = error.message
  } finally {
    isRegistering.value = false
  }
}

const handleSwitchToRegister = () => {
  showRegisterModal.value = true
}

const closeRegisterModal = () => {
  showRegisterModal.value = false
  resetRegisterForm()
}

const backToLogin = () => {
  showRegisterModal.value = false
  resetRegisterForm()
}

const clearError = () => {
  errorMessage.value = ''
}

const closeModal = () => {
  emit('close')
}

const resetForms = () => {
  username.value = ''
  password.value = ''
  errorMessage.value = ''
  isLoading.value = false
  resetRegisterForm()
}

const resetRegisterForm = () => {
  fullName.value = ''
  regUsername.value = ''
  email.value = ''
  regPassword.value = ''
  registerError.value = ''
  registerSuccess.value = ''
  isRegistering.value = false
}

// Limpiar formulario cuando se cierra el modal
watch(() => props.isVisible, (newValue) => {
  if (!newValue) {
    resetForms()
    showRegisterModal.value = false
  }
})
</script>

<style scoped>
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
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 450px;
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

.login-header,
.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2,
.register-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.login-header p,
.register-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

.login-form,
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  padding: 0.875rem;
  border: 2px solid #e0e6ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
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

.error-message {
  background: #fee;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}

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
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #1e6091 100%);
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.register-submit-button {
  padding: 1rem;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.register-submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #27ae60 0%, #219a52 100%);
  transform: translateY(-2px);
}

.register-submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.test-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.test-credentials code {
  background: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.register-section,
.login-section {
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.register-section p,
.login-section p {
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.register-button,
.back-to-login-button {
  background: none;
  border: 2px solid #3498db;
  color: #3498db;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.register-button:hover,
.back-to-login-button:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
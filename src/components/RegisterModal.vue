<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <button class="close-button" @click="closeModal">×</button>
      
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
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Usuario:</label>
          <input 
            type="text" 
            placeholder="Elige un nombre de usuario"
            v-model="username"
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Correo electrónico:</label>
          <input 
            type="email" 
            placeholder="tu@email.com"
            v-model="email"
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Contraseña:</label>
          <input 
            type="password"
            placeholder="Crea una contraseña segura (mín. 6 caracteres)"
            v-model="password"
            @input="clearError"
            :disabled="isLoading"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button 
          type="submit"
          :disabled="!isFormValid || isLoading"
          class="register-button"
        >
          <span v-if="isLoading">Creando cuenta...</span>
          <span v-else>Crear cuenta</span>
        </button>
      </form>

      <div class="login-section">
        <p>¿Ya tienes una cuenta?</p>
        <button 
          type="button" 
          class="login-button"
          @click="emit('switchToLogin')"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  close: []
  registerSuccess: [userData: { username: string; email: string }]
  switchToLogin: []
}>()

const fullName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isFormValid = computed(() => {
  return fullName.value.trim() !== '' &&
         username.value.trim() !== '' &&
         email.value.trim() !== '' &&
         password.value.length >= 6
})

const handleRegister = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor completa todos los campos correctamente'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const userExists = storedUsers.find((user: any) => 
      user.username === username.value || user.email === email.value
    )
    
    if (userExists) {
      throw new Error('El usuario o email ya está registrado')
    }
    
    const newUser = {
      fullName: fullName.value,
      username: username.value,
      email: email.value,
      password: password.value,
      createdAt: new Date().toISOString()
    }
    
    storedUsers.push(newUser)
    localStorage.setItem('registeredUsers', JSON.stringify(storedUsers))
    
    successMessage.value = '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.'
    
    setTimeout(() => {
      emit('switchToLogin')
      resetForm()
    }, 2000)
    
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

const clearError = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const closeModal = () => {
  emit('close')
}

const resetForm = () => {
  fullName.value = ''
  username.value = ''
  email.value = ''
  password.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = false
}

watch(() => props.isVisible, (newValue) => {
  if (!newValue) {
    resetForm()
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
  z-index: 1001;
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

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.register-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

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
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
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

.register-button {
  padding: 1rem;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 50px;
}

.register-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #27ae60 0%, #219a52 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-section {
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.login-section p {
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.login-button {
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

.login-button:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .register-header h2 {
    font-size: 1.5rem;
  }
  
  .form-group input,
  .register-button {
    padding: 0.75rem;
  }
}
</style>
<template>
  <div class="file-upload">
    <div class="upload-area" :class="{ 'dragging': isDragging }" @dragenter="handleDragEnter" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept=".csv"
        style="display: none"
      />
      
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <h3>Subir archivo CSV</h3>
        <p>Arrastra un archivo CSV aquí o haz clic para seleccionar</p>
        <button @click="openFileDialog" class="upload-btn">
          Seleccionar archivo
        </button>
      </div>
    </div>

    <!-- Mostrar error -->
    <div v-if="csvStore.error" class="error">
      {{ csvStore.error }}
    </div>

    <!-- Indicador de carga -->
    <div v-if="csvStore.isLoading" class="loading">
      Procesando archivo...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCSVStore } from '@/stores/csvStore'
import { parseCSV } from '@/utils/csvParser'

const csvStore = useCSVStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    processFile(file)
  }
}

const processFile = async (file: File) => {
  csvStore.setLoading(true)
  csvStore.setError(null)
  
  try {
    const text = await file.text()
    const csvData = parseCSV(text)
    csvStore.addCSVFile(csvData, file.name)
    
    // Limpiar input para permitir subir el mismo archivo otra vez
    if (fileInput.value) fileInput.value.value = ''
  } catch (error: any) {
    csvStore.setError(`Error al procesar el archivo: ${error.message}`)
  } finally {
    csvStore.setLoading(false)
  }
}

// Funciones de arrastrar y soltar
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  } else {
    csvStore.setError('Por favor, arrastra un archivo CSV válido.')
  }
}
</script>

<style scoped>
.file-upload {
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.upload-area.dragging {
  background-color: #e9ecef;
  border-color: #6c757d;
}

.upload-content {
  max-width: 400px;
  margin: 0 auto;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.upload-btn {
  background-color: #4e73df;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #2e59d9;
}

.error {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  font-size: 0.9rem;
}

.loading {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #d1ecf1;
  color: #0c5460;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
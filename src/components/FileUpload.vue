<template>
  <div class="file-upload">
    <div class="upload-area" :class="{ 'dragging': isDragging }">
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
        <p>Haz clic para seleccionar o arrastra un archivo CSV aquí</p>
        <button @click="openFileDialog" class="upload-btn">
          Seleccionar archivo
        </button>
      </div>
    </div>

    <!-- Mostrar información del archivo -->
    <div v-if="csvStore.fileName" class="file-info">
      <p><strong>Archivo:</strong> {{ csvStore.fileName }}</p>
      <p><strong>Filas:</strong> {{ csvStore.rowCount }}</p>
      <p><strong>Columnas:</strong> {{ csvStore.columnCount }}</p>
      <button @click="clearFile" class="clear-btn">Limpiar</button>
    </div>

    <!-- Mostrar error -->
    <div v-if="csvStore.error" class="error">
      {{ csvStore.error }}
    </div>

    <!-- Mostrar loading -->
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
const fileInput = ref<HTMLInputElement>()
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
    csvStore.setData(csvData, file.name)
  } catch (error) {
    csvStore.setError(`Error al procesar el archivo: ${(error as Error).message}`)
  } finally {
    csvStore.setLoading(false)
  }
}

const clearFile = () => {
  csvStore.clearData()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.file-upload {
  max-width: 500px;
  margin: 0 auto;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.3s;
  cursor: pointer;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: #2c3e50;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  pointer-events: auto;
}

.upload-btn:hover {
  background-color: #34495e;
}

.file-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.clear-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.error {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
}

.loading {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #d1ecf1;
  color: #0c5460;
  border-radius: 4px;
}
</style>
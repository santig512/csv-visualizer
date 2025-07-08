<template>
  <div class="charts-view">
    <h1>Vista de Gráficos</h1>
    
    <!-- Componente para subir archivo siempre visible -->
    <FileUpload />
    
    <!-- Lista de archivos cargados -->
    <div v-if="csvStore.csvFiles.length > 0" class="loaded-files">
      <h3>Archivos cargados</h3>
      <div class="file-list">
        <div 
          v-for="file in csvStore.csvFiles" 
          :key="file.id" 
          class="file-item"
          :class="{ 'active': file.id === csvStore.activeFileId }"
        >
          <div class="file-color" :style="{ backgroundColor: file.color }"></div>
          <div class="file-name">{{ file.fileName }}</div>
          <div class="file-actions">
            <button 
              @click="csvStore.setActiveFile(file.id)" 
              class="file-btn"
              title="Establecer como activo"
              v-if="file.id !== csvStore.activeFileId"
            >
              Activar
            </button>
            <button 
              @click="csvStore.removeCSVFile(file.id)" 
              class="file-btn delete"
              title="Eliminar archivo"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mostrar gráficos cuando hay datos -->
    <div v-if="csvStore.hasData" class="charts-container">
      <!-- Filtro por horas que también muestra la tabla de resultados -->
      <HourRangerFilter @filterChange="handleFilterChange" />
      
      <div class="charts-grid">
        <!-- Gráfico de líneas -->
        <LineChart 
          title="Gráfico de Líneas"
          :filteredData="filteredData"
        />
        
        <!-- Espacio para otro gráfico (opcional) -->
        <div class="placeholder-chart">
          <h3>Instrucciones</h3>
          <ul class="instructions">
            <li>Sube múltiples archivos CSV para comparar</li>
            <li>Selecciona el rango de horas que deseas consultar</li>
            <li>Observa los resultados en la tabla y en el gráfico</li>
            <li>Puedes activar/desactivar cada archivo en la lista superior</li>
          </ul>
        </div>
      </div>
      
      <!-- Información del archivo -->
      <div class="file-info">
        <div v-if="filteredData.length > 0" class="filter-badge">
          <span>Filtrando datos: {{ filteredData.length }} registros encontrados</span>
        </div>
        <button @click="clearAllData" class="clear-btn">Limpiar todos los datos</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCSVStore } from '@/stores/csvStore'
import FileUpload from '@/components/FileUpload.vue'
import LineChart from '@/components/LineChart.vue'
import HourRangerFilter from '@/components/HourRangerFilter.vue'

const csvStore = useCSVStore()
const filteredData = ref<Record<string, string>[]>([])

// Manejar resultados del filtro de horas
function handleFilterChange(results: Record<string, string>[]) {
  filteredData.value = results
}

function clearAllData() {
  csvStore.clearData()
  filteredData.value = []
}
</script>

<style scoped>
.charts-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.loaded-files {
  margin: 1.5rem 0;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-list {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.file-item.active {
  background-color: #e8f4fe;
  border-color: #4e73df;
}

.file-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.file-name {
  flex-grow: 1;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.file-btn {
  background-color: #4e73df;
  color: white;
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.file-btn.delete {
  background-color: #e74a3b;
}

.file-btn:hover {
  opacity: 0.9;
}

.charts-container {
  margin-top: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.placeholder-chart {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.instructions {
  text-align: left;
  line-height: 1.6;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.75rem;
}

.file-info {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-badge {
  padding: 0.5rem 1rem;
  background-color: #e8f4fe;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #2c3e50;
}

.clear-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-btn:hover {
  background-color: #c82333;
}

/* Responsive */
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .file-info {
    flex-direction: column;
  }
}
</style>
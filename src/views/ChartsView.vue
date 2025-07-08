<template>
  <div class="charts-view">
    <h1>Vista de Gráficos</h1>
    
    <!-- Componente para subir archivo -->
    <FileUpload v-if="!csvStore.hasData" />
    
    <!-- Mostrar gráficos cuando hay datos -->
    <div v-if="csvStore.hasData" class="charts-container">
      <!-- Constructor de consultas -->
      <QueryBuilder @queryResults="handleQueryResults" />
      
      <div class="charts-grid">
        <!-- Gráfico de líneas -->
        <LineChart 
          :title="filteredData.length > 0 ? 'Gráfico de Líneas (Filtrado)' : 'Gráfico de Líneas'"
          :data="chartData"
        />
        
        <!-- Aquí irán más gráficos -->
        <div class="placeholder-chart">
          <h3>Próximo gráfico</h3>
          <p>Aquí irá un gráfico de barras</p>
        </div>
      </div>
      
      <!-- Información del archivo -->
      <div class="file-info">
        <p><strong>Archivo:</strong> {{ csvStore.fileName }}</p>
        <p><strong>Datos originales:</strong> {{ csvStore.rowCount }} filas</p>
        <p v-if="filteredData.length > 0"><strong>Datos filtrados:</strong> {{ filteredData.length }} filas</p>
        <button @click="clearData" class="clear-btn">Limpiar datos</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCSVStore } from '@/stores/csvStore'
import FileUpload from '@/components/FileUpload.vue'
import LineChart from '@/components/LineChart.vue'
import QueryBuilder from '@/components/QueryBuilder.vue'

const csvStore = useCSVStore()

// Datos reactivos
const filteredData = ref<Record<string, string>[]>([])

// Computed properties
const chartData = computed(() => {
  if (filteredData.value.length > 0) {
    return {
      headers: csvStore.data?.headers || [],
      rows: filteredData.value
    }
  }
  return csvStore.data
})

// Funciones
const handleQueryResults = (results: Record<string, string>[]) => {
  filteredData.value = results
}

const clearData = () => {
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
  text-align: center;
  border: 2px dashed #ddd;
  color: #666;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-info {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  text-align: center;
}

.clear-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
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
}
</style>
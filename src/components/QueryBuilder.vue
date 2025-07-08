<template>
  <div class="query-builder">
    <div class="query-header">
      <h3>Filtros de Tiempo</h3>
      <button @click="clearQuery" class="clear-btn">Limpiar</button>
    </div>

    <div class="query-controls">
      <!-- Seleccionar columna para estadísticas -->
      <div class="filter-group">
        <label>Columna para estadísticas:</label>
        <select v-model="selectedColumn">
          <option value="">Selecciona columna</option>
          <option v-for="header in numericHeaders" :key="header" :value="header">
            {{ header }}
          </option>
        </select>
      </div>

      <!-- Filtros de tiempo -->
      <div class="filter-group">
        <label>Desde hora:</label>
        <select v-model="timeFrom">
          <option value="">Selecciona hora inicial</option>
          <option v-for="hour in availableHours" :key="hour" :value="hour">
            {{ hour }}:00
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Hasta hora:</label>
        <select v-model="timeTo">
          <option value="">Selecciona hora final</option>
          <option v-for="hour in availableHours" :key="hour" :value="hour">
            {{ hour }}:00
          </option>
        </select>
      </div>
      
      <button @click="applyTimeFilter" class="apply-btn" :disabled="!timeFrom || !timeTo">
        Aplicar Filtro
      </button>
    </div>

    <!-- Resultados -->
    <div v-if="queryResults.length > 0" class="query-results">
      <h4>Resultados ({{ queryResults.length }} filas)</h4>
      <p class="filter-info">
        <strong>Período:</strong> {{ timeFrom }}:00 - {{ timeTo }}:00
      </p>
      
      <div class="results-table">
        <table>
          <thead>
            <tr>
              <th v-for="header in headers" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in queryResults.slice(0, 15)" :key="index">
              <td v-for="header in headers" :key="header">
                {{ isNumericColumn(header) ? formatDecimalNumber(parseFloat(row[header])) : row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="queryResults.length > 15" class="more-results">
          Mostrando 15 de {{ queryResults.length }} resultados
        </p>
      </div>
    </div>

    <!-- Estadísticas de la columna seleccionada -->
    <div v-if="queryResults.length > 0 && selectedColumn" class="query-stats">
      <h4>Estadísticas de {{ selectedColumn }}</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <strong>Filas:</strong> {{ queryResults.length }}
        </div>
        <div class="stat-item">
          <strong>Promedio:</strong> {{ formatDecimalNumber(columnStats.avg) }}
        </div>
        <div class="stat-item">
          <strong>Mínimo:</strong> {{ formatDecimalNumber(columnStats.min) }}
        </div>
        <div class="stat-item">
          <strong>Máximo:</strong> {{ formatDecimalNumber(columnStats.max) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCSVStore } from '@/stores/csvStore'

const csvStore = useCSVStore()

// Datos reactivos
const selectedColumn = ref('')
const timeFrom = ref('')
const timeTo = ref('')
const queryResults = ref<Record<string, string>[]>([])

// Computed properties
const headers = computed(() => csvStore.data?.headers || [])

const numericHeaders = computed(() => {
  if (!csvStore.data || csvStore.data.rows.length === 0) return []
  
  return csvStore.data.headers.filter(header => {
    const sampleValues = csvStore.data!.rows.slice(0, 3)
    return sampleValues.every(row => {
      const value = row[header]
      return !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
    })
  })
})

// Arreglar la detección de horas
const availableHours = computed(() => {
  if (!csvStore.data) return []
  
  const hours = new Set<string>()
  
  console.log('Headers:', csvStore.data.headers)
  console.log('Sample row:', csvStore.data.rows[0])
  
  csvStore.data.rows.forEach(row => {
    // Buscar en todas las columnas y valores
    for (const [key, value] of Object.entries(row)) {
      const valueStr = value.toString()
      
      // Buscar patrones de hora: 06H00, 07H00, etc.
      if (valueStr.includes('H00')) {
        const timeMatch = valueStr.match(/(\d{2})H00/)
        if (timeMatch) {
          hours.add(timeMatch[1])
          console.log('Found hour:', timeMatch[1], 'in column:', key, 'value:', valueStr)
        }
      }
    }
  })
  
  const sortedHours = Array.from(hours).sort()
  console.log('Available hours:', sortedHours)
  return sortedHours
})

const columnStats = computed(() => {
  if (!selectedColumn.value || queryResults.value.length === 0) {
    return { avg: 0, min: 0, max: 0 }
  }

  const values = queryResults.value
    .map(row => parseFloat(row[selectedColumn.value]))
    .filter(val => !isNaN(val))
  
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0 }
  }

  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)

  return { avg, min, max }
})

// Funciones para formatear números
const formatDecimalNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: 3,
    maximumFractionDigits: 3 
  }).format(num)
}

const isNumericColumn = (header: string): boolean => {
  if (!csvStore.data || csvStore.data.rows.length === 0) return false
  
  const sampleValues = csvStore.data.rows.slice(0, 3)
  return sampleValues.every(row => {
    const value = row[header]
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
  })
}

// Función principal de filtrado
const applyTimeFilter = () => {
  if (!csvStore.data || !timeFrom.value || !timeTo.value) return

  console.log('Filtering from:', timeFrom.value, 'to:', timeTo.value)

  const fromHour = parseInt(timeFrom.value)
  const toHour = parseInt(timeTo.value)

  const results = csvStore.data.rows.filter(row => {
    // Buscar en todas las columnas una que contenga "H00"
    for (const [key, value] of Object.entries(row)) {
      const valueStr = value.toString()
      
      if (valueStr.includes('H00')) {
        const timeMatch = valueStr.match(/(\d{2})H00/)
        if (timeMatch) {
          const hour = parseInt(timeMatch[1])
          const inRange = hour >= fromHour && hour <= toHour
          if (inRange) {
            console.log('Including row with hour:', hour, 'from:', valueStr)
          }
          return inRange
        }
      }
    }
    
    return false
  })

  console.log('Filtered results:', results.length, 'rows')
  queryResults.value = results
}

const clearQuery = () => {
  selectedColumn.value = ''
  timeFrom.value = ''
  timeTo.value = ''
  queryResults.value = []
}

// Emits
const emit = defineEmits<{
  queryResults: [results: Record<string, string>[]]
}>()

import { watch } from 'vue'
watch(queryResults, (newResults) => {
  emit('queryResults', newResults)
})
</script>

<style scoped>
.query-builder {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.query-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.apply-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.apply-btn:hover:not(:disabled) {
  background-color: #34495e;
}

.apply-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.clear-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background-color: #c82333;
}

.query-results {
  margin-top: 1.5rem;
}

.filter-info {
  color: #666;
  margin-bottom: 1rem;
  font-style: italic;
}

.results-table {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.results-table th {
  background-color: #f8f9fa;
  font-weight: 500;
  position: sticky;
  top: 0;
}

.results-table tr:hover {
  background-color: #f8f9fa;
}

.more-results {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-style: italic;
}

.query-stats {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-item {
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
}

@media (max-width: 768px) {
  .query-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group select {
    min-width: 100%;
  }
}
</style>
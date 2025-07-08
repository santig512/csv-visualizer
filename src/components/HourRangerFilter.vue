<template>
  <div class="hour-filter">
    <h3>Filtrar por rango de horas</h3>
    
    <div class="filter-controls">
      <div class="time-group">
        <label>Desde:</label>
        <select v-model="fromHour" @change="applyFilter">
          <option v-for="hour in availableHours" :key="`from-${hour}`" :value="hour">
            {{ formatHour(hour) }}
          </option>
        </select>
      </div>
      
      <div class="time-group">
        <label>Hasta:</label>
        <select v-model="toHour" @change="applyFilter">
          <option v-for="hour in availableHours" :key="`to-${hour}`" :value="hour">
            {{ formatHour(hour) }}
          </option>
        </select>
      </div>
      
      <button @click="applyFilter" class="apply-btn">
        Aplicar filtro
      </button>
      
      <button @click="resetFilter" class="reset-btn">
        Mostrar todo
      </button>
    </div>
    
    <div v-if="hasFilter" class="filter-status">
      <p>
        Mostrando datos entre <strong>{{ formatHour(fromHour) }}</strong> y <strong>{{ formatHour(toHour) }}</strong>
      </p>
    </div>
    
    <!-- Tabla de resultados -->
    <div v-if="showTable" class="results-table-container">
      <h4>
        {{ hasFilter ? `Resultados de la consulta (${formatHour(fromHour)} - ${formatHour(toHour)})` : 'Todos los datos' }}
      </h4>
      <div class="table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th v-for="header in csvStore.data?.headers" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in paginatedRows" :key="index">
              <td v-for="header in csvStore.data?.headers" :key="header">
                {{ row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Paginación para la tabla -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = 1" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ««
        </button>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          «
        </button>
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }} ({{ displayedRows.length }} resultados)
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          »
        </button>
        <button 
          @click="currentPage = totalPages" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          »»
        </button>
      </div>
    </div>
    
    <!-- Mensaje si no hay resultados -->
    <div v-else-if="hasFilter && filteredRows.length === 0" class="no-results">
      <p>No se encontraron datos en el rango seleccionado</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCSVStore } from '@/stores/csvStore'

const props = defineProps<{
  hourColumnName?: string // Nombre de la columna que contiene las horas
}>()

const emit = defineEmits<{
  filterChange: [filteredData: Record<string, any>[]]
}>()

const csvStore = useCSVStore()

// Estado del filtro
const fromHour = ref(0)
const toHour = ref(23)
const hasFilter = ref(false)
const filteredRows = ref<Record<string, string>[]>([])

// Paginación para la tabla de resultados
const currentPage = ref(1)
const rowsPerPage = 15  // Aumentamos el número de filas por página para ver más datos

// Mostrar tabla cuando haya datos filtrados o no haya filtro activo pero hay datos
const showTable = computed(() => {
  if (hasFilter.value) {
    return filteredRows.value.length > 0
  }
  return csvStore.data?.rows && csvStore.data.rows.length > 0
})

// Filas a mostrar (filtradas o todas si no hay filtro)
const displayedRows = computed(() => {
  if (hasFilter.value) {
    return filteredRows.value
  }
  return csvStore.data?.rows || []
})

// Datos paginados para la tabla
const paginatedRows = computed(() => {
  const rows = displayedRows.value
  const start = (currentPage.value - 1) * rowsPerPage
  const end = start + rowsPerPage
  return rows.slice(start, end)
})

// Total de páginas basado en las filas a mostrar
const totalPages = computed(() => {
  return Math.ceil(displayedRows.value.length / rowsPerPage)
})

// Columna de horas (por defecto busca columnas que contengan "hora")
const hourColumn = computed(() => {
  if (props.hourColumnName) return props.hourColumnName
  
  // Para el ejemplo de datos que proporcionó el usuario, buscamos 'Time' primero
  const possibleColumns = ['time', 'hora', 'fecha', 'date']
  const headers = csvStore.data?.headers || []
  
  for (const header of headers) {
    if (possibleColumns.some(col => header.toLowerCase().includes(col.toLowerCase()))) {
      return header
    }
  }
  
  // Si no encuentra una columna específica, tratar de adivinar
  if (headers.length > 1) {
    // La columna Time suele ser la tercera en el ejemplo proporcionado
    return headers.length >= 3 ? headers[2] : headers[1]
  }
  
  return headers.length > 0 ? headers[0] : ''
})

// Detectar horas disponibles en el CSV
const availableHours = computed(() => {
  // Siempre retornar todas las horas posibles (0-23)
  return Array.from({ length: 24 }, (_, i) => i)
})

// Extraer la hora de una celda
function extractHour(cellValue: string): number | null {
  if (!cellValue) return null
  
  // Formato específico para "01H00", "02H00", etc.
  const hourPattern = /(\d{1,2})H\d{2}/i
  const match = cellValue.match(hourPattern)
  
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  
  // Intentamos extraer hora del inicio de la cadena (para otros formatos)
  if (cellValue && cellValue.length >= 2) {
    // Asumimos que los primeros dos caracteres son la hora
    const firstTwoChars = cellValue.substring(0, 2)
    if (!isNaN(parseInt(firstTwoChars))) {
      return parseInt(firstTwoChars)
    }
  }
  
  return null
}

// Formatear la hora para mostrar
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

// Aplicar filtro
function applyFilter() {
  if (!csvStore.data || !csvStore.data.rows || csvStore.data.rows.length === 0) {
    console.log("No hay datos en el CSV para filtrar")
    return
  }
  
  console.log(`Columna de hora detectada: ${hourColumn.value}`)
  hasFilter.value = true
  currentPage.value = 1
  
  // Primero verificamos qué columnas tenemos
  console.log("Columnas disponibles:", csvStore.data.headers)
  
  // Filtramos las filas por hora
  const filtered = csvStore.data.rows.filter(row => {
    const timeCell = row["Time"] || ''
    const hour = extractHour(timeCell)
    
    /*// Depuración
    if (filtered.length < 3) {
      console.log(`Celda ${timeCell}, hora extraída: ${hour}`)
    }*/
    
    if (hour === null) return false
    
    // Si fromHour <= toHour, filtro normal
    if (fromHour.value <= toHour.value) {
      return hour >= fromHour.value && hour <= toHour.value
    } 
    /*// Si fromHour > toHour, significa un rango que cruza la medianoche
    else {
      return hour >= fromHour.value || hour <= toHour.value
    }*/
  })
  
  
  console.log(`Filas filtradas: ${filtered.length} de ${csvStore.data.rows.length}`)
  
  // Asignamos los resultados y notificamos
  filteredRows.value = filtered
  emit('filterChange', filtered)
  
  // Para asegurar la reactividad
  if (filtered.length === 0) {
    console.log("No se encontraron resultados para este rango de horas")
  }
}

// Resetear filtro
function resetFilter() {
  hasFilter.value = false
  fromHour.value = 0
  toHour.value = 23
  filteredRows.value = []
  currentPage.value = 1
  emit('filterChange', csvStore.data?.rows || [])
}

// Cuando cambian los datos en el CSV store, verificamos si debemos actualizar nuestro filtro
watch(() => csvStore.data, () => {
  if (hasFilter.value) {
    applyFilter() // Reaplicar filtro con los nuevos datos
  }
}, { deep: true })

// Verificar datos al iniciar
watch(() => csvStore.data, (newData) => {
  if (newData) {
    console.log(`CSV cargado con ${newData.rows.length} filas`)
    // Detectar automáticamente la columna de hora
    console.log(`Columna de hora detectada: ${hourColumn.value}`)
  }
}, { immediate: true })

// Aplicar filtro inicial cuando se monte el componente
// Descomentar esta línea si quieres que el filtro se aplique automáticamente
// onMounted(() => applyFilter())
</script>

<style scoped>
.hour-filter {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.time-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #555;
}

.time-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 100px;
}

.apply-btn, .reset-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.apply-btn {
  background-color: #4e73df;
  color: white;
}

.apply-btn:hover {
  background-color: #2e59d9;
}

.reset-btn {
  background-color: #f8f9fa;
  color: #5a5c69;
  border: 1px solid #ddd;
}

.reset-btn:hover {
  background-color: #eaecf4;
}

.filter-status {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f4fe;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #2c3e50;
}

/* Estilos para la tabla de resultados */
.results-table-container {
  margin-top: 1.5rem;
  border: 1px solid #e3e6f0;
  border-radius: 4px;
  overflow: hidden;
}

.results-table-container h4 {
  margin: 0;
  padding: 1rem;
  background-color: #f8f9fc;
  border-bottom: 1px solid #e3e6f0;
  font-weight: 600;
}

.table-wrapper {
  max-height: 500px; /* Altura aumentada */
  overflow: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th, 
.results-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e3e6f0;
  font-size: 0.9rem;
}

.results-table th {
  background-color: #f8f9fc;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.results-table tr:hover {
  background-color: #f8f9fc;
}

.results-table td {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e3e6f0;
  background-color: #f8f9fc;
}

.page-btn {
  background-color: #4e73df;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.page-btn:hover:not(:disabled) {
  background-color: #2e59d9;
}

.page-btn:disabled {
  background-color: #b7c1f8;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: #5a5c69;
}

.no-results {
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
  color: #888;
}
</style>
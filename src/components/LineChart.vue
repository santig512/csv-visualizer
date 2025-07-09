<template>
  <div class="line-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
    </div>

    <!-- Panel de checkboxes -->
    <div class="checkbox-container">
      <!-- Columna X (solo se puede seleccionar una) -->
      <div class="checkbox-section">
        <h4>Columna para eje X:</h4>
        <div class="checkbox-list x-list">
          <div v-for="header in headers" :key="`x-${header}`" class="checkbox-item">
            <label>
              <input 
                type="radio" 
                :value="header" 
                v-model="xColumn"
                name="x-column"
                @change="updateChart"
              />
              <span class="checkbox-label">{{ header }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Columnas Y (se puede seleccionar múltiples) -->
      <div class="checkbox-section">
        <h4>Columnas para graficar:</h4>
        <div class="checkbox-list y-list">
          <div 
            v-for="header in numericHeaders" 
            :key="`y-${header}`" 
            class="checkbox-item"
          >
            <label>
              <input 
                type="checkbox" 
                :value="header" 
                v-model="selectedYColumns"
                @change="updateChart"
              />
              <span class="checkbox-label">{{ header }}</span>
              <span 
                v-if="selectedYColumns.includes(header)" 
                class="color-indicator" 
                :style="{ backgroundColor: getSeriesColor(header) }"
              ></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!canRender" class="chart-message">
      <p v-if="!xColumn">Selecciona una columna para el eje X</p>
      <p v-else-if="selectedYColumns.length === 0">Selecciona al menos una columna para graficar</p>
      <p v-else>No hay datos disponibles para mostrar</p>
    </div>

    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Estadísticas -->
    <div v-if="canRender" class="chart-stats">
      <div class="stat">
        <strong>Puntos:</strong> {{ processedDataPoints.length }}
      </div>
      <div v-for="column in selectedYColumns" :key="`stat-${column}`" class="stat-group">
        <div class="stat-header">
          <span 
            class="color-indicator" 
            :style="{ backgroundColor: getSeriesColor(column) }"
          ></span>
          <strong>{{ column }}</strong>
        </div>
        <div class="stat-values">
          <span class="stat-value">Min: {{ formatNumber(getMinValue(column)) }}</span>
          <span class="stat-value">Max: {{ formatNumber(getMaxValue(column)) }}</span>
          <span class="stat-value">Prom: {{ formatNumber(getAvgValue(column)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import { useCSVStore } from '@/stores/csvStore'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const csvStore = useCSVStore()

// Props
const props = defineProps<{
  title?: string
}>()

// Datos reactivos
const xColumn = ref('')
const selectedYColumns = ref<string[]>([])
const MAX_POINTS = 14 // Definimos exactamente 14 puntos

// Paleta de colores para series
const chartColors = [
  '#e74c3c', // Rojo
  '#3498db', // Azul
  '#2ecc71', // Verde
  '#f39c12', // Naranja
  '#9b59b6', // Morado
  '#1abc9c', // Verde azulado
  '#34495e', // Azul oscuro
  '#e67e22', // Naranja oscuro
  '#16a085', // Verde oscuro
  '#8e44ad', // Morado oscuro
  '#d35400', // Rojo oscuro
  '#2980b9'  // Azul oscuro
]

// Obtener color para una serie específica
function getSeriesColor(column: string): string {
  const index = selectedYColumns.value.indexOf(column)
  return chartColors[index % chartColors.length]
}

// Computed properties
const headers = computed(() => csvStore.data?.headers || [])

const numericHeaders = computed(() => {
  if (!csvStore.data) return []
  
  return csvStore.data.headers.filter(header => {
    const firstFewValues = csvStore.data!.rows.slice(0, 5)
    return firstFewValues.every(row => {
      const value = row[header]
      if (!value) return false
      const cleanValue = value.toString().replace(/\./g, '').replace(/,/g, '.')
      return !isNaN(parseFloat(cleanValue)) && isFinite(parseFloat(cleanValue))
    })
  })
})

const dataPoints = computed(() => {
  if (!csvStore.data || !xColumn.value || selectedYColumns.value.length === 0) return []
  
  return csvStore.data.rows.map(row => {
    const point: Record<string, any> = {
      label: row[xColumn.value] || ''
    }
    
    selectedYColumns.value.forEach(column => {
      const rawValue = row[column] || '0'
      // Limpiar formato numérico (puntos como separadores de miles y comas para decimales)
      const cleanValue = rawValue.toString().replace(/\./g, '').replace(/,/g, '.')
      point[column] = parseFloat(cleanValue) || 0
    })
    
    return point
  })
})

// Función para reducir los datos a exactamente 14 puntos para el gráfico
const processedDataPoints = computed(() => {
  const points = dataPoints.value
  
  if (points.length <= MAX_POINTS) {
    // Si tenemos 14 o menos puntos, los usamos todos
    return points
  }
  
  // Si tenemos más de 14 puntos, necesitamos muestrear
  const result: Record<string, any>[] = []
  const step = points.length / MAX_POINTS
  
  // Seleccionamos 14 puntos distribuidos uniformemente
  for (let i = 0; i < MAX_POINTS; i++) {
    const index = Math.min(Math.floor(i * step), points.length - 1)
    result.push(points[index])
  }
  
  return result
})

const canRender = computed(() => {
  return xColumn.value && selectedYColumns.value.length > 0 && processedDataPoints.value.length > 0
})

// Funciones para obtener estadísticas por columna
function getMinValue(column: string): number {
  const points = dataPoints.value // Usamos todos los puntos para estadísticas
  if (points.length === 0) return 0
  return Math.min(...points.map(p => p[column]))
}

function getMaxValue(column: string): number {
  const points = dataPoints.value // Usamos todos los puntos para estadísticas
  if (points.length === 0) return 0
  return Math.max(...points.map(p => p[column]))
}

function getAvgValue(column: string): number {
  const points = dataPoints.value // Usamos todos los puntos para estadísticas
  if (points.length === 0) return 0
  const sum = points.reduce((acc, p) => acc + p[column], 0)
  return sum / points.length
}

// Configuración del gráfico Chart.js
const chartData = computed((): ChartData<'line'> => {
  return {
    labels: processedDataPoints.value.map(p => p.label),
    datasets: selectedYColumns.value.map((column, index) => {
      const color = getSeriesColor(column)
      return {
        label: column,
        data: processedDataPoints.value.map(p => p[column]),
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 7,
        pointHoverRadius: 9,
        tension: 0.2,
        fill: false
      }
    })
  }
})

const chartOptions = computed((): ChartOptions<'line'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 14
        },
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xColumn.value,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: 10
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
          tickLength: 10,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 12
          },
          // Configurar para mostrar exactamente 14 ticks en el eje X
          maxTicksLimit: 14,
          maxRotation: 45
        }
      },
      y: {
        title: {
          display: selectedYColumns.value.length === 1,
          text: selectedYColumns.value.length === 1 ? selectedYColumns.value[0] : '',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: 10
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
         
          tickLength: 10,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 12
          },
          // Configurar para mostrar aproximadamente 14 ticks en el eje Y
          maxTicksLimit: 14,
          callback: function(value) {
            return formatNumber(Number(value))
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart'
    },
    layout: {
      padding: {
        top: 20,
        right: 25,
        bottom: 20,
        left: 25
      }
    }
  }
})

// Funciones auxiliares
const formatNumber = (num: number): string => {
  // Formatear con 3 decimales y separadores de miles en formato español
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: 3,
    maximumFractionDigits: 3 
  }).format(num)
}

const updateChart = () => {
  // El gráfico se actualiza automáticamente con los computed properties
}

// Watcher para resetear columnas si cambian los datos
watch(() => csvStore.data, () => {
  xColumn.value = ''
  selectedYColumns.value = []
})

// Auto-seleccionar columnas iniciales si es posible
watch(() => headers.value, (newHeaders) => {
  if (newHeaders.length > 0 && !xColumn.value) {
    // Intentar encontrar columna de tiempo/fecha para X
    const possibleXColumns = ['time', 'date', 'fecha', 'hora']
    let found = false
    
    for (const col of possibleXColumns) {
      const match = newHeaders.find(h => h.toLowerCase().includes(col))
      if (match) {
        xColumn.value = match
        found = true
        break
      }
    }
    
    // Si no encontramos una columna específica, usar la primera
    if (!found && newHeaders.length > 0) {
      xColumn.value = newHeaders[0]
    }
  }
})

watch(() => numericHeaders.value, (newNumericHeaders) => {
  if (newNumericHeaders.length > 0 && selectedYColumns.value.length === 0) {
    // Auto-seleccionar la primera columna numérica
    selectedYColumns.value = [newNumericHeaders[0]]
  }
})
</script>

<style scoped>
.line-chart {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.checkbox-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.checkbox-section {
  flex: 1;
}

.checkbox-section h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #444;
}

.checkbox-list {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  max-height: 180px;
  overflow-y: auto;
}

.x-list {
  background-color: #f0f7ff;
}

.y-list {
  background-color: #f7f7f7;
}

.checkbox-item {
  margin-bottom: 0.5rem;
}

.checkbox-item:last-child {
  margin-bottom: 0;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.checkbox-item label:hover {
  background-color: rgba(0,0,0,0.05);
}

.checkbox-item input {
  margin-right: 0.5rem;
}

.checkbox-label {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

/* Contenedor del gráfico ampliado con tamaño cuadrado y cuadrícula 14x14 */
.chart-container {
  width: 100%;
  height: 0;
  padding-bottom: 80%;
  position: relative;
  margin: 1rem 0;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fcfcfc;
}

.chart-container canvas {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.chart-message {
  text-align: center;
  padding: 6rem 2rem;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ddd;
  height: 0;
  padding-bottom: 80%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-message p {
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 1.2rem;
}

.chart-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eaeaea;
}

.stat {
  flex: 1 1 100%;
  font-size: 1rem;
  padding: 0.8rem;
  background-color: white;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-group {
  flex: 1;
  min-width: 180px;
  background-color: white;
  border-radius: 4px;
  padding: 0.8rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.4rem;
}

.stat-values {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 0.9rem;
  color: #495057;
  margin-bottom: 0.3rem;
}

@media (max-width: 768px) {
  .checkbox-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .chart-container {
    padding-bottom: 100%; /* Cuadrado completo en móviles */
  }
  
  .chart-message {
    padding-bottom: 100%;
  }
  
  .chart-stats {
    flex-direction: column;
  }
  
  .stat-group {
    min-width: auto;
  }
}
</style>
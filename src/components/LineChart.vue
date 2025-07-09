<template>
  <div class="line-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
    </div>

    <!-- Panel de checkboxes (mantener igual pero más compacto) -->
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

    <!-- INFORMACIÓN SOBRE FILTRO -->
    <div v-if="props.filteredData && props.filteredData.length > 0" class="filter-info">
      <div class="filter-badge">
        📊 Mostrando datos filtrados: {{ props.filteredData.length }} registros
      </div>
    </div>
    <div v-else-if="props.filteredData && props.filteredData.length === 0" class="filter-info">
      <div class="filter-badge no-data">
        ⚠️ No hay datos para el filtro seleccionado
      </div>
    </div>

    <div v-if="!canRender" class="chart-message">
      <p v-if="!xColumn">Selecciona una columna para el eje X</p>
      <p v-else-if="selectedYColumns.length === 0">Selecciona al menos una columna para graficar</p>
      <p v-else>No hay datos disponibles para mostrar</p>
    </div>

    <!-- GRÁFICO MUCHO MÁS GRANDE -->
    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Estadísticas -->
    <div v-if="canRender" class="chart-stats">
      <div class="stat">
        <strong>Puntos:</strong> {{ dataPoints.length }}
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

// Props - AGREGAR filteredData
const props = defineProps<{
  title?: string
  filteredData?: Record<string, string>[]
}>()

// Datos reactivos
const xColumn = ref('')
const selectedYColumns = ref<string[]>([])

// Paleta de colores para series
const chartColors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#34495e', '#e67e22', '#16a085', '#8e44ad',
  '#d35400', '#2980b9'
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

// USAR DATOS FILTRADOS SI ESTÁN DISPONIBLES
const dataPoints = computed(() => {
  if (!csvStore.data || !xColumn.value || selectedYColumns.value.length === 0) return []
  
  // Usar filteredData si está disponible, sino usar todos los datos
  const sourceData = props.filteredData && props.filteredData.length > 0 
    ? props.filteredData 
    : csvStore.data.rows
  
  return sourceData.map(row => {
    const point: Record<string, any> = {
      label: row[xColumn.value] || ''
    }
    
    selectedYColumns.value.forEach(column => {
      const rawValue = row[column] || '0'
      const cleanValue = rawValue.toString().replace(/\./g, '').replace(/,/g, '.')
      point[column] = parseFloat(cleanValue) || 0
    })
    
    return point
  })
})

const canRender = computed(() => {
  return xColumn.value && selectedYColumns.value.length > 0 && dataPoints.value.length > 0
})

// Funciones para obtener estadísticas por columna
function getMinValue(column: string): number {
  const points = dataPoints.value
  if (points.length === 0) return 0
  return Math.min(...points.map(p => p[column]))
}

function getMaxValue(column: string): number {
  const points = dataPoints.value
  if (points.length === 0) return 0
  return Math.max(...points.map(p => p[column]))
}

function getAvgValue(column: string): number {
  const points = dataPoints.value
  if (points.length === 0) return 0
  const sum = points.reduce((acc, p) => acc + p[column], 0)
  return sum / points.length
}

// Configuración del gráfico Chart.js
const chartData = computed((): ChartData<'line'> => {
  return {
    labels: dataPoints.value.map(p => p.label),
    datasets: selectedYColumns.value.map((column, index) => {
      const color = getSeriesColor(column)
      return {
        label: column,
        data: dataPoints.value.map(p => p[column]),
        borderColor: color,
        backgroundColor: `${color}25`,
        borderWidth: 5,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        tension: 0.3,
        fill: false
      }
    })
  }
})

const chartOptions = computed((): ChartOptions<'line'> => {
  const dataLength = dataPoints.value.length
  const suggestedXTicks = dataLength <= 30 ? dataLength : Math.min(30, Math.ceil(dataLength / 3))
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 15,
          font: {
            size: 16
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        padding: 15,
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        bodyFont: {
          size: 16
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
            size: 18,
            weight: 'bold'
          },
          padding: 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
          tickLength: 12,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: 14
          },
          maxTicksLimit: suggestedXTicks,
          maxRotation: 45,
          color: '#555'
        }
      },
      y: {
        title: {
          display: selectedYColumns.value.length === 1,
          text: selectedYColumns.value.length === 1 ? selectedYColumns.value[0] : '',
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
          tickLength: 12,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: 14
          },
          color: '#555',
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
      duration: 800,
      easing: 'easeOutQuart'
    },
    layout: {
      padding: {
        top: 25,
        right: 30,
        bottom: 25,
        left: 30
      }
    },
    elements: {
      point: {
        hitRadius: 15
      },
      line: {
        borderJoinStyle: 'round',
        capBezierPoints: true
      }
    }
  }
})

// Funciones auxiliares
const formatNumber = (num: number): string => {
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
    
    if (!found && newHeaders.length > 0) {
      xColumn.value = newHeaders[0]
    }
  }
})

watch(() => numericHeaders.value, (newNumericHeaders) => {
  if (newNumericHeaders.length > 0 && selectedYColumns.value.length === 0) {
    selectedYColumns.value = [newNumericHeaders[0]]
  }
})

// WATCH PARA DETECTAR CAMBIOS EN filteredData
watch(() => props.filteredData, (newFilteredData) => {
  console.log('Datos filtrados recibidos en LineChart:', newFilteredData?.length || 0)
}, { deep: true })
</script>

<style scoped>
.line-chart {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
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
  font-size: 1.5rem;
  color: #333;
}

.checkbox-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem; /* Reducido para dar más espacio al gráfico */
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
  max-height: 140px; /* Más compacto para dar espacio al gráfico */
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}

/* GRÁFICO GIGANTE */
.chart-container {
  width: 100%;
  height: 800px !important; /* ALTURA FIJA MUY GRANDE */
  position: relative;
  margin: 1.5rem 0;
  border: 3px solid #d0d0d0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fafafa;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.08);
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
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #ccc;
  height: 800px; /* Misma altura que el gráfico */
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-message p {
  font-size: 1.4rem;
  color: #999;
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
  font-size: 1.1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  font-weight: 600;
}

.stat-group {
  flex: 1;
  min-width: 200px;
  background-color: white;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.stat-values {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 0.95rem;
  color: #495057;
  margin-bottom: 0.4rem;
  font-weight: 500;
}

/* ESTILOS PARA LA INFORMACIÓN DEL FILTRO */
.filter-info {
  margin-bottom: 1rem;
  text-align: center;
}

.filter-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.filter-badge.no-data {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

@media (max-width: 768px) {
  .checkbox-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .chart-container {
    height: 600px !important; /* Más pequeño pero aún grande en móviles */
  }
  
  .chart-message {
    height: 600px;
  }
  
  .chart-stats {
    flex-direction: column;
  }
  
  .stat-group {
    min-width: auto;
  }
}
</style>
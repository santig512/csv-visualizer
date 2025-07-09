<template>
  <div class="line-chart" :class="{ 'compact': compact }">
    <div v-if="!compact" class="chart-header">
      <h3>{{ title }}</h3>
    </div>

    <!-- Panel de checkboxes más grande y fácil de usar -->
    <div class="checkbox-container" :class="{ 'compact': compact }">
      <!-- Columna X -->
      <div class="checkbox-section">
        <h4 class="checkbox-title">Eje X:</h4>
        <div class="checkbox-list x-list">
          <div v-for="header in headers" :key="`x-${header}`" class="checkbox-item">
            <label class="checkbox-label-container">
              <input 
                type="radio" 
                :value="header" 
                v-model="xColumn"
                name="x-column"
                @change="updateChart"
                class="checkbox-input"
              />
              <div class="checkbox-content">
                <span class="checkbox-text">{{ header }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Columnas Y -->
      <div class="checkbox-section">
        <h4 class="checkbox-title">Columnas Y:</h4>
        <div class="checkbox-list y-list">
          <div 
            v-for="header in numericHeaders" 
            :key="`y-${header}`" 
            class="checkbox-item"
          >
            <label class="checkbox-label-container">
              <input 
                type="checkbox" 
                :value="header" 
                v-model="selectedYColumns"
                @change="updateChart"
                class="checkbox-input"
              />
              <div class="checkbox-content">
                <span class="checkbox-text">{{ header }}</span>
                <span 
                  v-if="selectedYColumns.includes(header)" 
                  class="color-indicator" 
                  :style="{ backgroundColor: getSeriesColor(header) }"
                ></span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- INFORMACIÓN SOBRE FILTRO -->
    <div v-if="props.filteredData && props.filteredData.length > 0" class="filter-info">
      <div class="filter-badge">
        📊 {{ props.filteredData.length }} registros filtrados
      </div>
    </div>
    <div v-else-if="props.filteredData && props.filteredData.length === 0" class="filter-info">
      <div class="filter-badge no-data">
        ⚠️ Sin datos para el filtro
      </div>
    </div>

    <div v-if="!canRender" class="chart-message">
      <p v-if="!xColumn">Selecciona columna X</p>
      <p v-else-if="selectedYColumns.length === 0">Selecciona columnas Y</p>
      <p v-else>Sin datos disponibles</p>
    </div>

    <!-- GRÁFICO ADAPTABLE -->
    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
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

// Props - AGREGAR compact
const props = defineProps<{
  title?: string
  filteredData?: Record<string, string>[]
  compact?: boolean
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

// Funciones para estadísticas
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

// Configuración del gráfico
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
        borderWidth: props.compact ? 3 : 5,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: props.compact ? 2 : 3,
        pointRadius: props.compact ? 4 : 8,
        pointHoverRadius: props.compact ? 8 : 12,
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
          boxWidth: props.compact ? 10 : 15,
          font: {
            size: props.compact ? 12 : 16
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        padding: props.compact ? 10 : 15,
        titleFont: {
          size: props.compact ? 12 : 16,
          weight: 'bold'
        },
        bodyFont: {
          size: props.compact ? 12 : 16
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
            size: props.compact ? 12 : 18,
            weight: 'bold'
          },
          padding: props.compact ? 10 : 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
          tickLength: props.compact ? 6 : 12,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: props.compact ? 10 : 14
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
            size: props.compact ? 12 : 18,
            weight: 'bold'
          },
          padding: props.compact ? 10 : 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          display: true,
          tickLength: props.compact ? 6 : 12,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: props.compact ? 10 : 14
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
        top: props.compact ? 10 : 25,
        right: props.compact ? 15 : 30,
        bottom: props.compact ? 10 : 25,
        left: props.compact ? 15 : 30
      }
    },
    elements: {
      point: {
        hitRadius: props.compact ? 10 : 15
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(num)
}

const updateChart = () => {
  // El gráfico se actualiza automáticamente
}

// Watchers
watch(() => csvStore.data, () => {
  xColumn.value = ''
  selectedYColumns.value = []
})

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

watch(() => props.filteredData, (newFilteredData) => {
  console.log('Datos filtrados recibidos en LineChart:', newFilteredData?.length || 0)
}, { deep: true })
</script>

<style scoped>
/* CONTENEDOR PRINCIPAL */
.line-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-header {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

/* CHECKBOXES MUCHO MÁS GRANDES Y FÁCILES DE USAR */
.checkbox-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
  max-height: 180px; /* Limitar altura máxima */
}

.checkbox-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.checkbox-title {
  margin: 0 0 0.5rem 0.25rem;
  font-size: 1rem;
  color: #444;
  font-weight: 600;
}

.checkbox-list {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  max-height: 120px; /* Reducir altura para dejar más espacio al gráfico */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.x-list {
  background-color: #e7f3ff;
  border: 1px solid #c5e3ff;
}

.y-list {
  background-color: #f8f8f8;
  border: 1px solid #e9e9e9;
}

.checkbox-item {
  margin-bottom: 0;
}

.checkbox-label-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0.75rem; /* Reducir padding vertical */
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.9rem; /* Reducir un poco */
  border: 2px solid transparent;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.checkbox-label-container:hover {
  background-color: #f1f6ff;
  border-color: #b3d7ff;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}

.checkbox-input {
  margin-right: 0.75rem;
  width: 20px; /* Ligeramente más pequeño */
  height: 20px; /* Ligeramente más pequeño */
  cursor: pointer;
  transform: scale(1.2);
  accent-color: #0066cc;
}

.checkbox-content {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-text {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 0.5rem;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

/* INFORMACIÓN DE FILTRO - MÁS COMPACTA */
.filter-info {
  margin: 0.35rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.filter-badge {
  padding: 0.35rem 1rem;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 600;
  background-color: #e7f3ff;
  color: #0066cc;
  border: 1px solid #b3d9ff;
  box-shadow: 0 2px 5px rgba(0, 102, 204, 0.15);
}

.filter-badge.no-data {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  box-shadow: 0 2px 5px rgba(114, 28, 36, 0.15);
}

/* CONTENEDOR DE GRÁFICO - OCUPA EL MÁXIMO ESPACIO DISPONIBLE */
.chart-container {
  flex: 1;
  position: relative;
  min-height: 300px; /* Aumentar altura mínima */
  overflow: hidden;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  display: flex; /* Importante para que ocupe el espacio */
}

.chart-container canvas {
  position: relative !important; /* Cambiar de absolute a relative */
  width: 100% !important;
  height: 100% !important;
  min-height: inherit;
}

/* MENSAJE CUANDO NO SE PUEDE RENDERIZAR */
.chart-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ccc;
  min-height: 300px; /* Aumentar altura mínima */
}

.chart-message p {
  font-size: 1.2rem;
  color: #999;
  margin: 0;
  padding: 1rem;
}

/* MODO COMPACTO ESPECÍFICO */
.checkbox-container.compact {
  gap: 0.5rem;
  max-height: 150px;
}

.checkbox-container.compact .checkbox-list {
  max-height: 100px;
}

.checkbox-container.compact .checkbox-label-container {
  padding: 0.4rem 0.6rem;
}

.checkbox-container.compact .checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
}

/* RESPONSIVE PARA PANTALLAS MÁS PEQUEÑAS */
@media (max-width: 768px) {
  .checkbox-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .checkbox-list {
    max-height: 100px;
  }
  
  .checkbox-label-container {
    padding: 0.4rem;
    font-size: 0.85rem;
  }
  
  .checkbox-input {
    width: 16px;
    height: 16px;
    transform: scale(1.1);
  }
  
  .checkbox-text {
    font-size: 0.85rem;
  }
  
  .color-indicator {
    width: 15px;
    height: 16px;
  }
}
</style>
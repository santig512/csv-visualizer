<template>
  <div class="line-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-controls">
        <select v-model="xColumn" @change="updateChart">
          <option value="">Selecciona columna X</option>
          <option v-for="header in headers" :key="header" :value="header">
            {{ header }}
          </option>
        </select>
        <select v-model="yColumn" @change="updateChart">
          <option value="">Selecciona columna Y</option>
          <option v-for="header in numericHeaders" :key="header" :value="header">
            {{ header }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="!canRender" class="chart-message">
      <p>Selecciona las columnas X e Y para ver el gráfico</p>
    </div>

    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Estadísticas -->
    <div v-if="canRender" class="chart-stats">
      <div class="stat">
        <strong>Puntos:</strong> {{ dataPoints.length }}
      </div>
      <div class="stat">
        <strong>Mínimo:</strong> {{ formatNumber(minValue) }}
      </div>
      <div class="stat">
        <strong>Máximo:</strong> {{ formatNumber(maxValue) }}
      </div>
      <div class="stat">
        <strong>Promedio:</strong> {{ formatNumber(avgValue) }}
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
const yColumn = ref('')

// Computed properties
const headers = computed(() => csvStore.data?.headers || [])

const numericHeaders = computed(() => {
  if (!csvStore.data) return []
  
  return csvStore.data.headers.filter(header => {
    const firstFewValues = csvStore.data!.rows.slice(0, 5)
    return firstFewValues.every(row => {
      const value = row[header]
      return !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
    })
  })
})

const dataPoints = computed(() => {
  if (!csvStore.data || !xColumn.value || !yColumn.value) return []
  
  return csvStore.data.rows
    .map(row => ({
      label: row[xColumn.value] || '',
      value: parseFloat(row[yColumn.value]) || 0
    }))
    .filter(point => !isNaN(point.value))
})

const canRender = computed(() => {
  return xColumn.value && yColumn.value && dataPoints.value.length > 0
})

const minValue = computed(() => {
  if (dataPoints.value.length === 0) return 0
  return Math.min(...dataPoints.value.map(p => p.value))
})

const maxValue = computed(() => {
  if (dataPoints.value.length === 0) return 0
  return Math.max(...dataPoints.value.map(p => p.value))
})

const avgValue = computed(() => {
  if (dataPoints.value.length === 0) return 0
  const sum = dataPoints.value.reduce((acc, p) => acc + p.value, 0)
  return sum / dataPoints.value.length
})

// Configuración del gráfico Chart.js
const chartData = computed((): ChartData<'line'> => {
  return {
    labels: dataPoints.value.map(p => p.label),
    datasets: [
      {
        label: yColumn.value,
        data: dataPoints.value.map(p => p.value),
        borderColor: '#2c3e50',
        backgroundColor: 'rgba(44, 62, 80, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#e74c3c',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2, // Suaviza la línea
        fill: false
      }
    ]
  }
})

const chartOptions = computed((): ChartOptions<'line'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
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
          text: xColumn.value
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: yColumn.value
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
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
  yColumn.value = ''
})
</script>

<style scoped>
.line-chart {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-controls {
  display: flex;
  gap: 1rem;
}

.chart-controls select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.chart-container {
  height: 400px;
  margin: 1rem 0;
}

.chart-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.chart-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat {
  text-align: center;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .chart-controls {
    width: 100%;
    flex-direction: column;
  }
  
  .chart-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
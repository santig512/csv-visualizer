<template>
  <div class="table-view">
    <h1>Vista de Tabla</h1>
    
    <!-- Componente para subir archivo -->
    <FileUpload v-if="!csvStore.hasData" />
    
    <!-- Mostrar tabla cuando hay datos -->
    <div v-if="csvStore.hasData" class="table-container">
      <!-- Se eliminó la referencia a QueryBuilder -->
      
      <!-- Tabla principal -->
      <div class="data-table">
        <h3>Datos del CSV</h3>
        <div class="table-info">
          <p><strong>Mostrando:</strong> {{ displayData.length }} de {{ totalRows }} filas</p>
          <p><strong>Archivo:</strong> {{ csvStore.fileName }}</p>
        </div>
        
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="header in headers" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in displayData" :key="index">
                <td v-for="header in headers" :key="header">
                  {{ row[header] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div class="pagination" v-if="totalPages > 1">
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
            Página {{ currentPage }} de {{ totalPages }}
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCSVStore } from '@/stores/csvStore'
import FileUpload from '@/components/FileUpload.vue'
// Se eliminó la importación de QueryBuilder

const csvStore = useCSVStore()

// Datos reactivos
const currentPage = ref(1)
const rowsPerPage = 50

// Computed properties
const headers = computed(() => csvStore.data?.headers || [])

const totalRows = computed(() => csvStore.rowCount)

const displayData = computed(() => {
  const data = csvStore.data?.rows || []
  const start = (currentPage.value - 1) * rowsPerPage
  const end = start + rowsPerPage
  return data.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(totalRows.value / rowsPerPage)
})

// Se eliminó la función handleQueryResults
</script>

<style scoped>
.table-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.table-container {
  margin-top: 2rem;
}

.data-table {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.table-wrapper {
  max-height: 600px;
  overflow: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 13px;
}

.data-table th {
  background-color: #2c3e50;
  color: white;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tr:hover {
  background-color: #f8f9fa;
}

.data-table td {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
}

.page-btn {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #34495e;
}

.page-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: #555;
}

@media (max-width: 768px) {
  .table-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.5rem;
    font-size: 12px;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>
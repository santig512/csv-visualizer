import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CSVData } from '@/types/csv'

export const useCSVStore = defineStore('csv', () => {
  // Estado para múltiples archivos CSV
  const csvFiles = ref<{
    id: string;
    fileName: string;
    data: CSVData;
    color: string;
  }[]>([])
  
  const activeFileId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Colores predefinidos para los archivos
  const availableColors = [
    '#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#36b9cc',
    '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69'
  ]

  // Computed properties
  const hasData = computed(() => csvFiles.value.length > 0)
  
  const activeFile = computed(() => {
    if (!activeFileId.value) return csvFiles.value[0] || null
    return csvFiles.value.find(f => f.id === activeFileId.value) || null
  })
  
  const data = computed(() => activeFile.value?.data || null)
  const fileName = computed(() => activeFile.value?.fileName || '')
  const rowCount = computed(() => data.value?.rows.length || 0)
  const columnCount = computed(() => data.value?.headers.length || 0)

  // Acciones
  function setLoading(value: boolean) {
    isLoading.value = value
  }

  function setError(value: string | null) {
    error.value = value
  }

  function addCSVFile(data: CSVData, fileName: string) {
    const id = `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const colorIndex = csvFiles.value.length % availableColors.length
    
    csvFiles.value.push({
      id,
      fileName,
      data,
      color: availableColors[colorIndex]
    })
    
    activeFileId.value = id
  }
  
  function removeCSVFile(id: string) {
    csvFiles.value = csvFiles.value.filter(file => file.id !== id)
    if (activeFileId.value === id) {
      activeFileId.value = csvFiles.value.length > 0 ? csvFiles.value[0].id : null
    }
  }
  
  function setActiveFile(id: string) {
    activeFileId.value = id
  }

  function clearData() {
    csvFiles.value = []
    activeFileId.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    csvFiles,
    activeFileId,
    isLoading,
    error,
    hasData,
    activeFile,
    data,
    fileName,
    rowCount,
    columnCount,
    setLoading,
    setError,
    addCSVFile,
    removeCSVFile,
    setActiveFile,
    clearData
  }
})
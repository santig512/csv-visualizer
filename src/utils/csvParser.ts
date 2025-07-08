import type { CSVData } from '@/types/csv'

export const parseCSV = (csvText: string): CSVData => {
  // Limpiar el texto y dividir en líneas
  const lines = csvText.trim().split('\n')
  
  if (lines.length === 0) {
    throw new Error('El archivo CSV está vacío')
  }

  // Primera línea = headers (nombres de columnas)
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
  
  if (headers.length === 0) {
    throw new Error('No se encontraron columnas en el CSV')
  }

  // Resto de líneas = datos
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Saltar líneas vacías
    if (!line) continue
    
    // Dividir la línea en valores
    const values = line.split(',').map(value => value.trim().replace(/"/g, ''))
    
    // Crear objeto con header: valor
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }

  return {
    headers,
    rows
  }
}

// Función para convertir datos CSV a formato de gráfico
export const csvToChartData = (csvData: CSVData, labelColumn: string, valueColumn: string) => {
  const labels: string[] = []
  const values: number[] = []
  
  csvData.rows.forEach(row => {
    const label = row[labelColumn] || 'Sin nombre'
    const value = parseFloat(row[valueColumn]) || 0
    
    labels.push(label)
    values.push(value)
  })
  
  return { labels, values }
}
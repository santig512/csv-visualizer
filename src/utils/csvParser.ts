import type { CSVData } from '@/types/csv'

export function parseCSV(csvText: string): CSVData {
  if (!csvText || csvText.trim() === '') {
    throw new Error('El archivo CSV está vacío')
  }

  const lines = csvText.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos')
  }

  // Parsear encabezados
  const headers = parseCSVLine(lines[0])
  
  if (headers.length === 0) {
    throw new Error('No se pudieron encontrar encabezados válidos en el CSV')
  }

  // Parsear filas de datos
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Saltar líneas vacías
    if (line === '') continue
    
    const values = parseCSVLine(line)
    
    // Crear objeto con los datos de la fila
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }

  if (rows.length === 0) {
    throw new Error('No se encontraron filas de datos válidas en el CSV')
  }

  console.log(`CSV parseado: ${headers.length} columnas, ${rows.length} filas`)
  
  return {
    headers,
    rows
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Comilla escapada
        current += '"'
        i++ // Saltar la siguiente comilla
      } else {
        // Cambiar estado de comillas
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Separador encontrado fuera de comillas
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Añadir el último valor
  result.push(current.trim())
  
  return result
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
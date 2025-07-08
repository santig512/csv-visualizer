export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface CSVState {
  data: CSVData | null;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
}
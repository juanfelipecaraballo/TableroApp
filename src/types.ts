export interface ExcelData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataBySheet: Record<string, any[]>;
  vacunasNombres: string[];
  anios: string[];
  departamentos: string[];
}
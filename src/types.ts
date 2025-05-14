
export type DatosPorAño = Record<string, {
  CODEP: string;
  DEPARTAMENTOS: string;
  [vacuna: string]: string; // los valores como 'VOP <DE1 AÑO + VIP %' son strings
}[]>;
export interface ExcelData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataBySheet: Record<string, any[]>;
  vacunasNombres: string[];
  anios: string[];
  departamentos: string[];
}
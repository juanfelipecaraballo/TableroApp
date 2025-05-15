
import { useEffect, useState } from 'react';
import './App.css'
import ColombiaHeatMap from "./components/ColombiaHeatMap.tsx";
import * as XLSX from 'xlsx';
import type { ExcelData } from './types.ts';
import LineChartVacuna from './components/LineChartVacuna.tsx';
import BarChartVacunas from './components/BarChartVacunas.tsx';
import EstadisticasGlobales from './components/EstadisticasGlobales.tsx';
import TopDepartamentos from './components/TopDepartamentos.tsx';


async function loadLocalExcel(): Promise<ExcelData> {
  const response = await fetch('/data/data.xlsx');
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataBySheet: Record<string, any[]> = {};
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    dataBySheet[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false
    });
  });

  const primeraFila = dataBySheet['2014'][0];
  const llavesAExcluir = [
    "CODEP",
    "DEPARTAMENTOS",
    "Población Menor 1 año (Meta",
    "Población 5 años (Meta",
    "Población de 1 Año (Meta",
    "FLU de 50 años y más",
    "Gestantes a partir de la semana 14",
  ];
  const vacunasNombres = Object.keys(primeraFila)
    .filter(item => !llavesAExcluir.includes(item) && !item.includes('%'));
  const anios = Object.keys(dataBySheet);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const departamentos = dataBySheet['2014'].map((item: any) => item.DEPARTAMENTOS === 'TOTAL' ? null : item.DEPARTAMENTOS).filter((item: string | null) => item !== null);

  return { dataBySheet, vacunasNombres, anios, departamentos };
}
function App() {
  const [data, setData] = useState<ExcelData | null>(null);

  useEffect(() => {
    loadLocalExcel()
      .then(data => {
        console.log('Datos cargados por año:', data);
        setData(data);
      })
      .catch(err => {
        console.error('Error cargando Excel:', err);
      });
  }, []);

  return (
    <main className="w-screen h-screen overflow-scroll bg-white">
      <h1 className='text-6xl m-16 font-bold text-center'>Cobertura de vacunación en Colombia</h1>
      <h2 className='text-5xl m-16 font-bold text-center'>Tablero descriptivo</h2>
      <EstadisticasGlobales data={data} />
      <ColombiaHeatMap data={data} />
      <div className='flex m-16 gap-8 justify-between box-border'>
        {data && <TopDepartamentos data={data} />}
        {data && <BarChartVacunas data={data} />}
      </div>
      <LineChartVacuna
        data={data}
      />
    </main>
  );
}

export default App

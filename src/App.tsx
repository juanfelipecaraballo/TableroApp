import { useEffect, useState } from 'react';
import './App.css'
import ColombiaHeatMap from "./components/ColombiaHeatMap.tsx";
import * as XLSX from 'xlsx';
import type { ExcelData } from './types.ts';
import LineChartVacuna from './components/LineChartVacuna.tsx';
import BarChartVacunas from './components/BarChartVacunas.tsx';
import EstadisticasGlobales from './components/EstadisticasGlobales.tsx';
import TopDepartamentos from './components/TopDepartamentos.tsx';
import PruebaHipotesis from './components/PruebaHipotesis.tsx';
import getSelectStyle from './utils/getSelectStyle.ts';
import ComparacionMedias from './components/ComparacionMedias.tsx';
import ComparacionMediaHistorica from './components/ComparacionMediaHistorica.tsx';
import CoberturaRecomendada from './components/CoberturaRecomendada.tsx';
import TendenciaBrechaCobertura from './components/TendenciaBrechaCobertura.tsx';
import EstadisticasGrupoPeriodo from './components/EstadisticasGrupoPeriodo.tsx';

interface DepartamentoPDET {
  departamento: string;
  cantidadMunicipiosPDET: number;
}

interface DepartamentosPDET {
  altoPDET: DepartamentoPDET[];
  bajoPDET: DepartamentoPDET[];
}

async function loadDepartamentosPDET(dataDepartamentos: string[]): Promise<DepartamentosPDET> {
  const response = await fetch('/data/municipios_pdet.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });

  // Contar municipios PDET por departamento
  const conteo: Record<string, number> = {};
  rows.forEach(row => {
    const dep = row['Departamento'];
    if (dep) {
      conteo[dep] = (conteo[dep] || 0) + 1;
    }
  });

  // Clasificación: >=5 municipios PDET es alta concentración
  const altoPDET: DepartamentoPDET[] = [];
  const bajoPDET: DepartamentoPDET[] = [];
  Object.entries(conteo).forEach(([departamento, cantidad]) => {
    if (cantidad >= 5) {
      altoPDET.push({ departamento, cantidadMunicipiosPDET: cantidad });
    } else {
      bajoPDET.push({ departamento, cantidadMunicipiosPDET: cantidad });
    }
  });

  // Agregar departamentos que no son PDET a bajoPDET
  const pdetDepartamentos = Object.keys(conteo);
  dataDepartamentos.forEach(dep => {
    if (!pdetDepartamentos.includes(dep)) {
      bajoPDET.push({ departamento: dep, cantidadMunicipiosPDET: 0 });
    }
  });

  const municipiosPDET = { altoPDET, bajoPDET };
  return municipiosPDET;
}

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

const VACUNAS = [
  { label: "Triple viral 1 año", value: "SRP (T.V.) DE UN AÑO%" },
  { label: "Triple viral 5 años", value: "SRP (T.V.) 5 AÑOS%" }
];
const PERIODOS = [
  { label: "Antes del acuerdo (2014-2016)", value: "antes" },
  { label: "Después del acuerdo (2017-2019)", value: "despues" },
  { label: "Ambos periodos (2014-2019)", value: "ambos" }
];

function App() {
  const [data, setData] = useState<ExcelData | null>(null);
  const [departamentosPDET, setDepartamentosPDET] = useState<DepartamentosPDET | null>(null);

  // Estados globales para periodo y vacuna
  const [periodo, setPeriodo] = useState<"antes" | "despues" | "ambos">("ambos");
  const [vacuna, setVacuna] = useState<string>("SRP (T.V.) DE UN AÑO%");

  useEffect(() => {
    async function fetchData() {
      const excelData = await loadLocalExcel();
      console.log("Cobertura de vacunación:", excelData);
      setData(excelData);

      const pdetData = await loadDepartamentosPDET(excelData.departamentos);
      console.log("Departamentos PDET:", pdetData);
      setDepartamentosPDET(pdetData);
    }
    fetchData();
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
      <LineChartVacuna data={data} />

      <h2 className='text-5xl m-16 font-bold text-center'>Tablero inferencial</h2>
      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-center w-2/3 mx-auto">
        <select
          className={getSelectStyle(periodo)}
          value={periodo}
          onChange={e => setPeriodo(e.target.value as "antes" | "despues" | "ambos")}
        >
          {PERIODOS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className={getSelectStyle(vacuna)}
          value={vacuna}
          onChange={e => setVacuna(e.target.value)}
        >
          {VACUNAS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <PruebaHipotesis
        data={data}
        departamentosPDET={departamentosPDET}
        periodo={periodo}
        vacuna={vacuna}
      />
      <ComparacionMedias
        data={data}
        departamentosPDET={departamentosPDET}
        vacuna={vacuna}
      />
      <ComparacionMediaHistorica
        data={data}
        departamentosPDET={departamentosPDET}
        vacuna={vacuna}
      />

      <h2 className='text-5xl m-16 font-bold text-center'>Tablero clínico</h2>
      <div className='flex m-16 gap-8 justify-between box-border'>
        <TendenciaBrechaCobertura
          data={data}
          departamentosPDET={departamentosPDET}
          vacuna={vacuna}
        />
        <CoberturaRecomendada data={data} vacuna={vacuna} departamentosPDET={departamentosPDET} />
      </div>
      <EstadisticasGrupoPeriodo
        data={data}
        departamentosPDET={departamentosPDET}
        vacuna={vacuna}
      />
    </main>
  );
}

export default App;

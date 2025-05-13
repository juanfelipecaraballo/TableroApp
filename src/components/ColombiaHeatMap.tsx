/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import * as XLSX from 'xlsx';

// Importa tu archivo GeoJSON de departamentos
import colombiaGeo from "./Colombia.geo.json";
import { useEffect } from "react";

// Define los departamentos válidos
type Departamento =
  | "Antioquia"
  | "Cundinamarca"
  | "Valle del Cauca";
// Agrega más departamentos si los necesitas

// Objeto con frecuencias por departamento
const frequencies: Record<Departamento, number> = {
  Antioquia: 120,
  Cundinamarca: 80,
  "Valle del Cauca": 60,
};

const getColor = (value: number) => {
  if (value > 100) return "#800026";
  if (value > 80) return "#BD0026";
  if (value > 60) return "#E31A1C";
  if (value > 40) return "#FC4E2A";
  if (value > 20) return "#FD8D3C";
  if (value > 0) return "#FEB24C";
  return "#FFEDA0";
};

// Type guard para verificar si un nombre es un Departamento válido
interface ExcelData {
  dataBySheet: Record<string, any[]>;
  vacunasNombres: string[];
  anios: string[];
}

async function loadLocalExcel(): Promise<ExcelData> {
  const response = await fetch('/data/data.xlsx');
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
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
    "Población 5 años (Meta"
  ];
  const vacunasNombres = Object.keys(primeraFila)
    .filter(item => !llavesAExcluir.includes(item));
  const anios = Object.keys(dataBySheet);

  return { dataBySheet, vacunasNombres, anios };
}

export default function ColombiaHeatMap() {

  useEffect(() => {
    loadLocalExcel()
      .then(data => {
        console.log('Datos cargados por año:', data);
        // aquí podrías setear estado, procesar, etc.
      })
      .catch(err => {
        console.error('Error cargando Excel:', err);
      });
  }, []);

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 2000, center: [-74, 4.5] }}
    >
      <Geographies geography={colombiaGeo}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name = geo.properties.NOMBRE_DPT;
            const value = 0;

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getColor(value)}
                stroke="#FFF"
                strokeWidth={0.5}
                onClick={() => console.log(name)}
                style={{
                  default: { fill: "#06F" },
                  hover: { fill: "#04D" },
                  pressed: { fill: "#02A" },
                }}
              >
                <h1>ervereverg</h1>
              </Geography>
            );
          })
        }
      </Geographies>
    </ComposableMap>
  )
}
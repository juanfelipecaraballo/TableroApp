import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

// Importa tu archivo GeoJSON de departamentos
import colombiaGeo from "./Colombia.geo.json";

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
function isDepartamento(key: any): key is Departamento {
  return key in frequencies;
}

const ColombiaHeatMap: React.FC = () => (
  <ComposableMap
    projection="geoMercator"
    projectionConfig={{ scale: 2000, center: [-74, 4.5] }}
  >
    <Geographies geography={colombiaGeo}>
      {({ geographies }) =>
        geographies.map((geo) => {
          const name = geo.properties.NOMBRE_DPT;
          const value = isDepartamento(name) ? frequencies[name] : 0;

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
);

export default ColombiaHeatMap;

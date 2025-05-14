import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

// Importa tu archivo GeoJSON de departamentos
import colombiaGeo from "./Colombia.geo.json";
import type { ExcelData } from "../types";
import { useEffect, useState } from "react";

const getColor = (value: number) => {
  // 1) Limitar el valor entre 0 y 100
  const capped = Math.max(0, Math.min(100, value));

  // 2) Redondear al múltiplo de 10 inferior: 0, 10, 20, …, 100
  const step = Math.floor(capped / 10) * 10;

  // 3) Calcular la componente verde y azul (de 255 → 0)
  //    – A 0%  => g = 255 (blanco)
  //    – A 100% => g = 0   (rojo puro)
  const g = Math.round(255 - (step / 100) * 255);

  // 4) Componer color RGB
  return `rgb(255, ${g}, ${g})`;
};

function ColorScaleLegend() {
  // Genera los valores 0, 10, 20, …, 100
  const steps = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex">
        {steps.map((value) => (
          <div
            key={value}
            style={{ backgroundColor: getColor(value) }}
            className="w-8 h-8 border border-gray-300"
            title={`${value}%`}
          />
        ))}
      </div>
      <div className="flex justify-between w-full px-1 text-xs text-gray-700">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>30%</span>
        <span>40%</span>
        <span>50%</span>
        <span>60%</span>
        <span>70%</span>
        <span>80%</span>
        <span>90%</span>
        <span>100%</span>
      </div>
      <div className="text-sm text-gray-800">
        <span className="font-semibold">Menor cobertura</span>{" "}
        <span className="px-4" />{" "}
        <span className="font-semibold">Mayor cobertura</span>
      </div>
    </div>
  );
}

function DepartmentDetail({departmentName, departmentCoverage}: { departmentName: string, departmentCoverage: number }) {
  return (
    <article className="bg-white shadow-md rounded-lg p-4 mt-4 text-black">
      <h2 className="text-xl font-bold mb-2">{departmentName}</h2>
      <p className="text-gray-700">
        Cobertura de vacuna: {departmentCoverage}%
      </p>
      <p className="text-gray-700">
        {departmentCoverage < 50
          ? "La cobertura de vacunas es baja. Se recomienda aumentar la vacunación."
          : departmentCoverage < 80
          ? "La cobertura de vacunas es moderada. Se recomienda seguir promoviendo la vacunación."
          : "La cobertura de vacunas es alta. ¡Buen trabajo!"}
      </p>
    </article>
  )
}


export default function ColombiaHeatMap({ data }: { data: ExcelData | null }) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedVaccine, setSelectedVaccine] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [frequenciesByDepartment, setFrequenciesByDepartment] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedYear && selectedVaccine) {
      const dataByYear = data?.dataBySheet[selectedYear];
      if (dataByYear) {
        const frequencies: Record<string, number> = {};
        dataByYear.forEach((item) => {
          const departmentName = item.DEPARTAMENTOS;
          const value = item[selectedVaccine + "%"];
          if (departmentName && value !== null) {
            frequencies[departmentName] = value;
          }
        });
        setFrequenciesByDepartment(frequencies);
      }
    }
  }, [selectedYear, selectedVaccine, data?.dataBySheet]);

  return (
    <section>
      <h1 className="text-3xl font-bold text-center">Cobertura de vacunas de Colombia</h1>

      <div className="flex gap-4">
        <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" onChange={(e) => setSelectedYear(e.target.value)}>
          <option selected>Seleccione su año de interés</option>
          {data?.anios.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>

        <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" onChange={(e) => setSelectedVaccine(e.target.value)}>
          <option selected>Seleccione su vacuna de interés</option>
          {data?.vacunasNombres.map((vacuna) => (
            <option key={vacuna} value={vacuna}>
              {vacuna}
            </option>
          ))}
        </select>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2000, center: [-74, 4.5] }}
      >
        <Geographies geography={colombiaGeo}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.NOMBRE_DPT;
              const value = frequenciesByDepartment[name] || 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(value)}
                  stroke="#FFF"
                  strokeWidth={0.5}
                  onClick={() => setSelectedDepartment(name)}
                  style={{
                    hover: { fill: "#02A" },
                    pressed: { fill: "#02A" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <div className="flex justify-center mt-4">
        <ColorScaleLegend />
      </div>

      {selectedDepartment ? (
        <DepartmentDetail departmentName={selectedDepartment} departmentCoverage={frequenciesByDepartment[selectedDepartment] || 0} />
      ) : null}
    </section>

  )
}
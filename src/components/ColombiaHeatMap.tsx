import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import colombiaGeo from "../../public/data/colombia.geo.json";
import type { ExcelData } from "../types";
import { useEffect, useState } from "react";
import getSelectStyle from "../utils/getSelectStyle";

// Escala de púrpura: de blanco (255,255,255) a #8884d8 (136,132,216)
const PURPLE_RGB = { r: 136, g: 132, b: 216 };

const getColor = (value: number, selectedYear: string | null, selectedVaccine: string | null) => {
  if (selectedYear && selectedVaccine) {
    if (value < 10) {
      return "#f9f9fd";
    }
    // Limita entre 0 y 100 y redondea al múltiplo de 10 inferior
    const capped = Math.max(0, Math.min(100, value));
    const step = Math.floor(capped / 10) * 10;
    const fraction = step / 100; // 0 → 1

    // Interpola cada canal desde blanco (255) hasta púrpura
    const r = Math.round(255 + (PURPLE_RGB.r - 255) * fraction);
    const g = Math.round(255 + (PURPLE_RGB.g - 255) * fraction);
    const b = Math.round(255 + (PURPLE_RGB.b - 255) * fraction);

    return `rgb(${r}, ${g}, ${b})`;
  }
  return "#EAEAEA";
};



function ColorScaleLegend() {
  const steps = Array.from({ length: 11 }, (_, i) => i * 10);
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex">
        {steps.map((value) => (
          <div
            key={value}
            style={{ backgroundColor: getColor(value, 'default', 'default') }}
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
};

function DepartmentDetail({ departmentName, departmentCoverage, selectedVaccine, selectedYear }: { departmentName: string, departmentCoverage: number, selectedVaccine: string, selectedYear: string }) {
  return (
    <article className="bg-white shadow-md rounded-lg p-4 text-black w-2/3">
      <h2 className="text-xl font-bold mb-2">{departmentName}</h2>
      <p className="text-gray-700">
        Cobertura de la vacuna {selectedVaccine} en {selectedYear}: {departmentCoverage}%
      </p>
      <p className={
        "rounded px-3 py-2 mt-2 font-medium " +
        (departmentCoverage < 50
          ? "bg-red-100 text-red-700"
          : departmentCoverage < 80
            ? "bg-orange-100 text-orange-700"
            : "bg-green-100 text-green-700")
      }>
        {departmentCoverage < 50
          ? "La cobertura de vacunas es baja. Se recomienda aumentar la vacunación."
          : departmentCoverage < 80
            ? "La cobertura de vacunas es moderada. Se recomienda seguir promoviendo la vacunación."
            : "La cobertura de vacunas es alta. ¡Buen trabajo!"}
      </p>
    </article>
  )
};

export default function ColombiaHeatMap({ data }: { data: ExcelData | null }) {
  const [selectedYear, setSelectedYear] = useState<string | null>('2014');
  const [selectedVaccine, setSelectedVaccine] = useState<string | null>('VOP <DE1 AÑO + VIP <1AÑO 3as');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>('AMAZONAS');
  const [frequenciesByDepartment, setFrequenciesByDepartment] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedYear === 'Seleccione su año de interés' || selectedVaccine === 'Seleccione su vacuna de interés') {
      setSelectedDepartment(null);
      setFrequenciesByDepartment({});
      if (selectedYear === 'Seleccione su año de interés') {
        setSelectedYear(null);
      }
      if (selectedVaccine === 'Seleccione su vacuna de interés') {
        setSelectedVaccine(null);
      }
    } else if (selectedYear && selectedVaccine) {
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
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Cobertura de vacunas de Colombia</h1>

      <div className="flex gap-4 h-full">
        <div className="h-full flex flex-col gap-4 w-1/3">
          <select id="countries" className={getSelectStyle(selectedYear)} onChange={(e) => setSelectedYear(e.target.value)} value={selectedYear?.toString()}>
            {data?.anios.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>

          <select id="countries" className={getSelectStyle(selectedVaccine)} onChange={(e) => setSelectedVaccine(e.target.value)} value={selectedVaccine?.toString()}>
            {data?.vacunasNombres.map((vacuna) => (
              <option key={vacuna} value={vacuna}>
                {vacuna}
              </option>
            ))}
          </select>
        </div>

        {selectedDepartment ? (
          <DepartmentDetail departmentName={selectedDepartment} departmentCoverage={frequenciesByDepartment[selectedDepartment] || 0 } selectedVaccine={selectedVaccine || ""} selectedYear={selectedYear || ""} />
        ) : null}
      </div>

      <div className="flex justify-center mt-4">
        <ColorScaleLegend />
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
                  className={`${selectedYear && selectedVaccine ? "hover:cursor-pointer" : "hover:cursor-default"} hover:${name === selectedDepartment ? "fill-[#5BC236]" : "fill-[#9B9B9B]"}`}
                  key={geo.rsmKey}
                  geography={geo}
                  fill={name === selectedDepartment ? "#8884d8" : getColor(value, selectedYear, selectedVaccine)}
                  stroke={selectedDepartment === name ? "#6c66e3" : "#FFFFFF"}
                  strokeWidth={2}
                  onClick={() => selectedYear && selectedVaccine ? setSelectedDepartment(name) : setSelectedDepartment(null)}
                  style={{
                    default: {
                      outline: "none",
                      cursor: selectedYear && selectedVaccine ? "pointer" : "not-allowed",
                    },
                    hover: {
                      outline: "none",
                      cursor: selectedYear && selectedVaccine ? "pointer" : "not-allowed",
                      fill: selectedYear && selectedVaccine ? "#8884d8" : "",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </section>

  )
}
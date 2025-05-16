import { useEffect, useState } from "react";
import type { ExcelData } from "../types";
import getSelectStyle from "../utils/getSelectStyle";

export default function EstadisticasGlobales({ data }: { data: ExcelData | null }) {
  const [selectedYear, setSelectedYear] = useState<string>('2014');
  const [selectedVaccine, setSelectedVaccine] = useState<string>('VOP <DE1 AÑO + VIP <1AÑO 3as');
  const [promedioDeCobertura, setPromedioDeCobertura] = useState<number | null>(null);
  const [desviacionEstandar, setDesviacionEstandar] = useState<number | null>(null);
  const [maxCobertura, setMaxCobertura] = useState<number | null>(null);
  const [minCobertura, setMinCobertura] = useState<number | null>(null);

  useEffect(() => {
    if (!data) {
      setPromedioDeCobertura(null);
      setDesviacionEstandar(null);
      setMaxCobertura(null);
      setMinCobertura(null);
      return;
    }

    const valores: number[] = [];

    // Filtrar por año
    const anios = selectedYear === 'Todos' ? data.anios : [selectedYear];

    anios.forEach((anio) => {
      const sheet = data.dataBySheet[anio];
      if (!sheet) return;

      sheet.forEach((row) => {
        // Filtrar por vacuna
        const vacunas = selectedVaccine === 'Todas' ? data.vacunasNombres : [selectedVaccine];
        vacunas.forEach((vacuna) => {
          const valorStr = row[vacuna + '%'];
          const valor = parseFloat(valorStr?.toString().replace(',', '.') || '');
          if (!isNaN(valor)) {
            valores.push(valor);
          }
        });
      });
    });

    if (valores.length === 0) {
      setPromedioDeCobertura(null);
      setDesviacionEstandar(null);
      setMaxCobertura(null);
      setMinCobertura(null);
    } else {
      const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
      setPromedioDeCobertura(promedio);

      // Calcular desviación estándar
      const variance = valores.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / valores.length;
      setDesviacionEstandar(Math.sqrt(variance));

      // Calcular máximo y mínimo
      setMaxCobertura(Math.max(...valores));
      setMinCobertura(Math.min(...valores));
    }
  }, [selectedYear, selectedVaccine, data]);

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Estadísticas globales</h1>

      <div className="h-full flex gap-4">
        <select id="countries" className={getSelectStyle(selectedYear)} onChange={(e) => setSelectedYear(e.target.value)} value={selectedYear}>
          <option value="Todos">Todos</option>
          {data?.anios.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>

        <select id="countries" className={getSelectStyle(selectedVaccine)} onChange={(e) => setSelectedVaccine(e.target.value)} value={selectedVaccine}>
          <option value="Todas">Todas</option>
          {data?.vacunasNombres.map((vacuna) => (
            <option key={vacuna} value={vacuna}>
              {vacuna}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mt-8">
        {/* Promedio de cobertura */}
        <article className="bg-white w-1/4 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <h1 className="text-gray-500 font-bold text-center mb-4">Promedio de cobertura</h1>
          <p className={
            "text-4xl font-bold text-center " +
            (promedioDeCobertura !== null
              ? promedioDeCobertura >= 95
                ? "text-green-600"
                : promedioDeCobertura >= 80
                  ? "text-orange-500"
                  : "text-red-600"
              : "")
          }>
            {promedioDeCobertura !== null ? promedioDeCobertura.toFixed(2) + '%' : 'N/A'}
          </p>
          <p className="text-gray-500 text-xs text-center px-4 mt-2">{`Promedio de cobertura en ${selectedYear === 'Todos' ? 'todos los años' : selectedYear} para ${selectedVaccine === 'Todas' ? 'todas las vacunas' : 'la vacuna ' + selectedVaccine}`}</p>
          <p className="text-sm text-center mt-2">
            {promedioDeCobertura !== null
              ? promedioDeCobertura >= 95
                ? '¡Excelente! El promedio de cobertura es óptimo.'
                : promedioDeCobertura >= 80
                  ? 'Buen trabajo, pero se recomienda aumentar la cobertura para alcanzar el 95%.'
                  : 'Cobertura baja. Es importante reforzar campañas de vacunación.'
              : ''}
          </p>
        </article>

        {/* Desviación estándar */}
        <article className="bg-white w-1/4 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <h1 className="text-gray-500 font-bold text-center mb-4">Desviación estándar</h1>
          <p className={
            "text-4xl font-bold text-center " +
            (desviacionEstandar !== null
              ? desviacionEstandar < 5
                ? "text-green-600"
                : desviacionEstandar < 10
                  ? "text-orange-500"
                  : "text-red-600"
              : "")
          }>
            {desviacionEstandar !== null ? desviacionEstandar.toFixed(2) + '%' : 'N/A'}
          </p>
          <p className="text-gray-500 text-xs text-center px-4 mt-2">{`Desviación estándar de la cobertura en ${selectedYear === 'Todos' ? 'todos los años' : selectedYear} para ${selectedVaccine === 'Todas' ? 'todas las vacunas' : 'la vacuna ' + selectedVaccine}`}</p>
          <p className="text-sm text-center mt-2">
            {desviacionEstandar !== null
              ? desviacionEstandar < 5
                ? 'La cobertura es homogénea entre los departamentos.'
                : 'Existen diferencias importantes de cobertura entre departamentos. Analiza los casos con menor cobertura.'
              : ''}
          </p>
        </article>

        {/* Cobertura máxima */}
        <article className="bg-white w-1/4 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <h1 className="text-gray-500 font-bold text-center mb-4">Cobertura máxima</h1>
          <p className={
            "text-4xl font-bold text-center " +
            (maxCobertura !== null
              ? maxCobertura >= 95
                ? "text-green-600"
                : maxCobertura >= 80
                  ? "text-orange-500"
                  : "text-red-600"
              : "")
          }>
            {maxCobertura !== null ? maxCobertura.toFixed(2) + '%' : 'N/A'}
          </p>
          <p className="text-gray-500 text-xs text-center px-4 mt-2">{`Cobertura máxima en ${selectedYear === 'Todos' ? 'todos los años' : selectedYear} para ${selectedVaccine === 'Todas' ? 'todas las vacunas' : 'la vacuna ' + selectedVaccine}`}</p>
          <p className="text-sm text-center mt-2">
            {maxCobertura !== null
              ? maxCobertura >= 100
                ? '¡Cobertura sobresaliente en al menos un caso!'
                : maxCobertura >= 95
                  ? 'Algunos departamentos alcanzan la meta de cobertura.'
                  : 'Ningún departamento alcanza el 95% de cobertura máxima.'
              : ''}
          </p>
        </article>

        {/* Cobertura mínima */}
        <article className="bg-white w-1/4 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <h1 className="text-gray-500 font-bold text-center mb-4">Cobertura mínima</h1>
          <p className={
            "text-4xl font-bold text-center " +
            (minCobertura !== null
              ? minCobertura >= 80
                ? "text-green-600"
                : minCobertura >= 60
                  ? "text-orange-500"
                  : "text-red-600"
              : "")
          }>
            {minCobertura !== null ? minCobertura.toFixed(2) + '%' : 'N/A'}
          </p>
          <p className="text-gray-500 text-xs text-center px-4 mt-2">{`Cobertura mínima en ${selectedYear === 'Todos' ? 'todos los años' : selectedYear} para ${selectedVaccine === 'Todas' ? 'todas las vacunas' : 'la vacuna ' + selectedVaccine}`}</p>
          <p className="text-sm text-center mt-2">
            {minCobertura !== null
              ? minCobertura < 80
                ? 'Al menos un departamento presenta cobertura crítica (<80%). Prioriza acciones en estos lugares.'
                : 'La cobertura mínima es aceptable, pero se recomienda seguir mejorando.'
              : ''}
          </p>
        </article>
      </div>
    </section>
  )
}

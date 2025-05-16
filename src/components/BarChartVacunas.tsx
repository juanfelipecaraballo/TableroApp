import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ExcelData } from '../types';
import { useEffect, useState } from 'react';
import getSelectStyle from '../utils/getSelectStyle';

interface Props {
  data: ExcelData;
}

export default function BarChartVacunas({ data }: Props) {
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>('AMAZONAS');
  const [selectedAnio, setSelectedAnio] = useState<string | null>('2014');
  const [topType, setTopType] = useState<'mayor' | 'menor'>('mayor');
  const [chartData, setChartData] = useState<{ vacuna: string; cobertura: number }[]>([]);

  useEffect(() => {
    if (selectedDepartamento === 'Seleccione un departamento' || selectedAnio === 'Seleccione un año') {
      setChartData([]);
      if (selectedDepartamento === 'Seleccione un departamento') {
        setSelectedDepartamento(null);
      };
      if (selectedAnio === 'Seleccione un año') {
        setSelectedAnio(null);
      };
    } else if (selectedDepartamento && selectedAnio) {
      const fila = data.dataBySheet[selectedAnio ?? '2014'].find(
        (row) => row.DEPARTAMENTOS === selectedDepartamento
      );
      const dataToDiplay = data.vacunasNombres
        .map((vacuna) => {
          const valorStr = fila[vacuna + '%'];
          const valor = parseFloat(valorStr?.toString().replace(',', '.') || '0');
          return {
            vacuna,
            cobertura: isNaN(valor) ? 0 : valor,
          };
        })
        .sort((a, b) =>
          topType === 'mayor'
            ? b.cobertura - a.cobertura
            : a.cobertura - b.cobertura
        )
        .slice(0, 5);
      setChartData(dataToDiplay);
    }
  }, [selectedDepartamento, selectedAnio, topType, data.vacunasNombres, data.dataBySheet]);

  let mensaje = '';
  let recomendacion = '';

  if (chartData.length > 0) {
    const nombres = chartData.map(d => d.vacuna).join(', ');
    if (topType === 'mayor') {
      mensaje = `Las vacunas con mayor cobertura en ${selectedDepartamento} durante ${selectedAnio} son: ${nombres}.`;
      const allHigh = chartData.every(d => d.cobertura >= 95);
      if (allHigh) {
        recomendacion = '¡Excelente! Todas las vacunas del top 5 superan el 95% de cobertura. Mantén las estrategias actuales.';
      } else {
        recomendacion = 'Buen trabajo, pero busca que todas las vacunas superen el 95% de cobertura para una protección óptima.';
      }
    } else {
      mensaje = `Las vacunas con menor cobertura en ${selectedDepartamento} durante ${selectedAnio} son: ${nombres}.`;
      const anyLow = chartData.some(d => d.cobertura < 80);
      if (anyLow) {
        recomendacion = 'Atención: Hay vacunas con coberturas menores al 80%. Refuerza campañas y estrategias de vacunación para mejorar estos indicadores.';
      } else {
        recomendacion = 'Las coberturas son aceptables, pero siempre es posible mejorar. Analiza causas y refuerza la promoción.';
      }
    }
  } else {
    mensaje = 'No hay datos suficientes para mostrar recomendaciones.';
    recomendacion = '';
  }

  return (
    <section className='bg-zinc-100 p-8 rounded-2xl w-1/2'>
      <h1 className="text-3xl font-bold text-center mb-8 h-20">
        Top 5 vacunas con {topType === 'mayor' ? 'mayor' : 'menor'} cobertura por departamento y año
      </h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          className={getSelectStyle(selectedAnio)}
          onChange={(e) => setSelectedAnio(e.target.value)}
          value={selectedAnio?.toString()}
        >
          {data?.anios.map((vac) => (
            <option key={vac} value={vac}>{vac}</option>
          ))}
        </select>
        <select
          className={getSelectStyle(selectedDepartamento)}
          onChange={(e) => setSelectedDepartamento(e.target.value)}
          value={selectedDepartamento?.toString()}
        >
          {data?.departamentos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <select
          className={getSelectStyle(topType)}
          value={topType}
          onChange={(e) => setTopType(e.target.value as 'mayor' | 'menor')}
        >
          <option value="mayor">Top 5 mayor cobertura</option>
          <option value="menor">Top 5 menor cobertura</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="vacuna"
            tickFormatter={(name: string) =>
              name.length > 20 ? name.slice(0, 20) + "..." : name
            }
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="cobertura" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 p-4 rounded-xl border border-gray-300 bg-white shadow text-center h-48">
        <p className="text-lg font-semibold h-24">{mensaje}</p>
        {recomendacion && (
          <p
            className={
              "text-sm mt-2 rounded px-3 py-2 font-medium " +
              (topType === 'mayor'
                ? chartData.every(d => d.cobertura >= 95)
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
                : chartData.some(d => d.cobertura < 80)
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
              )
            }
          >
            {recomendacion}
          </p>
        )}
      </div>
    </section>
  );
}

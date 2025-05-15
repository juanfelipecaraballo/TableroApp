import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ExcelData } from '../types';
import { useEffect, useState } from 'react';
import getSelectStyle from '../utils/getSelectStyle';

interface Props {
  data: ExcelData;
}

export default function TopDepartamentos({ data }: Props) {
  const [selectedVacuna, setSelectedVacuna] = useState<string>(data.vacunasNombres[0]);
  const [selectedAnio, setSelectedAnio] = useState<string>(data.anios[0]);
  const [topType, setTopType] = useState<'mayor' | 'menor'>('mayor');
  const [chartData, setChartData] = useState<{ departamento: string; cobertura: number }[]>([]);

  useEffect(() => {
    if (!selectedVacuna || !selectedAnio) {
      setChartData([]);
      return;
    }
    const sheet = data.dataBySheet[selectedAnio];
    const dataToDisplay = data.departamentos
      .map((dep) => {
        const row = sheet.find((r) => r.DEPARTAMENTOS === dep);
        const valorStr = row?.[selectedVacuna + '%'];
        const valor = parseFloat(valorStr?.toString().replace(',', '.') || '0');
        return {
          departamento: dep,
          cobertura: isNaN(valor) ? 0 : valor,
        };
      })
      .sort((a, b) =>
        topType === 'mayor'
          ? b.cobertura - a.cobertura
          : a.cobertura - b.cobertura
      )
      .slice(0, 5);
    setChartData(dataToDisplay);
  }, [selectedVacuna, selectedAnio, topType, data]);

  // Mensaje y recomendación
  let mensaje = '';
  let recomendacion = '';
  if (chartData.length > 0) {
    const nombres = chartData.map(d => d.departamento).join(', ');
    if (topType === 'mayor') {
      mensaje = `Los departamentos con mayor cobertura para ${selectedVacuna} en ${selectedAnio} son: ${nombres}.`;
      const allHigh = chartData.every(d => d.cobertura >= 95);
      if (allHigh) {
        recomendacion = '¡Excelente! Todos los departamentos del top 5 superan el 95% de cobertura. Mantén las estrategias actuales.';
      } else {
        recomendacion = 'Buen trabajo, pero busca que todos los departamentos superen el 95% de cobertura para una protección óptima.';
      }
    } else {
      mensaje = `Los departamentos con menor cobertura para ${selectedVacuna} en ${selectedAnio} son: ${nombres}.`;
      const anyLow = chartData.some(d => d.cobertura < 80);
      if (anyLow) {
        recomendacion = 'Atención: Hay departamentos con coberturas menores al 80%. Refuerza campañas y estrategias de vacunación en estas regiones.';
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
        Top 5 departamentos con {topType === 'mayor' ? 'mayor' : 'menor'} cobertura por vacuna y año
      </h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          className={getSelectStyle(selectedAnio)}
          onChange={(e) => setSelectedAnio(e.target.value)}
          value={selectedAnio}
        >
          {data?.anios.map((anio) => (
            <option key={anio} value={anio}>{anio}</option>
          ))}
        </select>
        <select
          className={getSelectStyle(selectedVacuna)}
          onChange={(e) => setSelectedVacuna(e.target.value)}
          value={selectedVacuna}
        >
          {data?.vacunasNombres.map((vac) => (
            <option key={vac} value={vac}>{vac}</option>
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
            dataKey="departamento"
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
      <div className="mt-8 p-4 rounded-xl border border-gray-300 bg-white shadow text-center h-40">
        <p className="text-lg font-semibold">{mensaje}</p>
        {recomendacion && <p className="text-sm text-gray-600 mt-2">{recomendacion}</p>}
      </div>
    </section>
  );
}

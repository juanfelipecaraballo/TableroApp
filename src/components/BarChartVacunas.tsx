import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ExcelData } from '../types';
import { useEffect, useState } from 'react';
import getSelectStyle from '../utils/getSelectStyle';

interface Props {
  data: ExcelData;
}

export default function BarChartVacunas({ data }: Props) {
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(null);
  const [selectedAnio, setSelectedAnio] = useState<string | null>(null);
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

  return (
    <section className='bg-zinc-100 p-8 rounded-2xl w-3/5'>
      <h1 className="text-3xl font-bold text-center mb-8 h-20">
        Top 5 vacunas con {topType === 'mayor' ? 'mayor' : 'menor'} cobertura por departamento y año
      </h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          className={getSelectStyle(selectedAnio)}
          onChange={(e) => setSelectedAnio(e.target.value)}
        >
          <option value="Seleccione un año">Seleccione un año</option>
          {data?.anios.map((vac) => (
            <option key={vac} value={vac}>{vac}</option>
          ))}
        </select>
        <select
          className={getSelectStyle(selectedDepartamento)}
          onChange={(e) => setSelectedDepartamento(e.target.value)}
        >
          <option value="Seleccione un departamento">Seleccione un departamento</option>
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
    </section>
  );
}

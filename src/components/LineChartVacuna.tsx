import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExcelData } from '../types';
import { useState } from 'react';
import getSelectStyle from '../utils/getSelectStyle';

interface Props {
  data: ExcelData | null;

}

export default function LineChartVacuna({ data }: Props) {

  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
  const [selectedVacuna, setSelectedVacuna] = useState<string>('');
  if (!data) return null;

  const chartData = data.anios.map((anio) => {
    const rows = data.dataBySheet[anio];
    const row = rows.find((d) => d.DEPARTAMENTOS === selectedDepartamento);
    const valorStr = row?.[selectedVacuna + '%'];
    const valor = parseFloat(valorStr?.replace(',', '.') || '0');

    return {
      anio,
      cobertura: isNaN(valor) ? null : valor,
    };
  });

  return (
    <section className="bg-zinc-100 p-8 rounded-2xl w-2/5">
      <h1 className="text-3xl font-bold text-center mb-8 h-20">Porcentaje histórico de cobertura por vacuna y departamento</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className={getSelectStyle(selectedDepartamento)}
          onChange={(e) => setSelectedDepartamento(e.target.value)}
        >
          <option value="">Seleccione un departamento</option>
          {data?.departamentos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

        <select
          className={getSelectStyle(selectedVacuna)}
          onChange={(e) => setSelectedVacuna(e.target.value)}
        >
          <option value="">Seleccione una vacuna</option>
          {data?.vacunasNombres.map((vac) => (
            <option key={vac} value={vac}>{vac}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="anio" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cobertura" name={`Cobertura %`} stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer></section>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ExcelData } from '../types';
import { useState } from 'react';

interface Props {
  data: ExcelData;
}

export default function BarChartVacunas({ data }: Props) {

  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('AMAZONAS');
  const [selectedAnio, setSelectedAnio] = useState<string>('2014');
  if (!data || !selectedDepartamento || !selectedAnio) return null;

  const fila = data.dataBySheet[selectedAnio].find(
    (row) => row.DEPARTAMENTOS === selectedDepartamento
  );

  if (!fila) return <p>No hay datos para {selectedDepartamento} en {selectedAnio}</p>;

  const chartData = data.vacunasNombres.map((vacuna) => {
    const valorStr = fila[vacuna];
    const valor = parseFloat(valorStr?.toString().replace(',', '.') || '0');
    return {
      vacuna,
      cobertura: isNaN(valor) ? 0 : valor,
    };
  }).sort((a, b) => b.cobertura - a.cobertura);

  return (

    <section>
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2.5 text-black"
          onChange={(e) => setSelectedAnio(e.target.value)}
        >
          <option value="">Seleccione un año</option>
          {data?.anios.map((vac) => (
            <option key={vac} value={vac}>{vac}</option>
          ))}
        </select>
        <select
          className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2.5 text-black"
          onChange={(e) => setSelectedDepartamento(e.target.value)}
        >
          <option value="">Seleccione un departamento</option>
          {data?.departamentos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

        
      </div>
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="vacuna" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cobertura" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer></section>
  );
}

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExcelData } from '../types';
import { useEffect, useState } from 'react';
import getSelectStyle from '../utils/getSelectStyle';

interface Props {
  data: ExcelData | null;
}

export default function LineChartVacuna({ data }: Props) {
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('AMAZONAS');
  const [selectedVacuna, setSelectedVacuna] = useState<string>('VOP <DE1 AÑO + VIP <1AÑO 3as');
  const [chartData, setChartData] = useState<{ anio: string; cobertura: number | null }[]>([]);
  const [tendencia, setTendencia] = useState<'creciente' | 'decreciente' | 'estable' | null>(null);

  useEffect(() => {
    const dataToDiplay = data?.anios.map((anio) => {
      const rows = data.dataBySheet[anio];
      const row = rows.find((d) => d.DEPARTAMENTOS === selectedDepartamento);
      const valorStr = row?.[selectedVacuna + '%'];
      const valor = parseFloat(valorStr?.replace(',', '.') || '0');
      return {
        anio,
        cobertura: isNaN(valor) ? null : valor,
      };
    }) || [];

    setChartData(dataToDiplay);

    // Calcular tendencia
    const coberturas = dataToDiplay.map(d => d.cobertura).filter((v): v is number => v !== null);
    if (coberturas.length > 1) {
      const first = coberturas[0];
      const last = coberturas[coberturas.length - 1];
      if (last > first + 2) setTendencia('creciente');
      else if (last < first - 2) setTendencia('decreciente');
      else setTendencia('estable');
    } else {
      setTendencia(null);
    }
  }, [data, selectedDepartamento, selectedVacuna]);

  if (!data) return null;

  // Mensaje y recomendación
  let mensaje = '';
  let recomendacion = '';
  if (tendencia === 'creciente') {
    mensaje = `¡Buen trabajo! El porcentaje de cobertura para la vacuna ${selectedVacuna} en el departamento ${selectedDepartamento} ha tenido una tendencia de crecimiento.`;
    recomendacion = 'Continúa con las estrategias actuales de vacunación y promoción.';
  } else if (tendencia === 'decreciente') {
    mensaje = `Atención: El porcentaje de cobertura para la vacuna ${selectedVacuna} en el departamento ${selectedDepartamento} ha tenido una tendencia de decrecimiento.`;
    recomendacion = 'Revisa las posibles causas, refuerza campañas de vacunación y sensibilización.';
  } else if (tendencia === 'estable') {
    mensaje = `La cobertura para la vacuna ${selectedVacuna} en el departamento ${selectedDepartamento} se ha mantenido estable.`;
    recomendacion = 'Busca oportunidades para mejorar la cobertura y alcanzar niveles óptimos (>95%).';
  } else {
    mensaje = 'No hay suficientes datos para determinar la tendencia.';
    recomendacion = '';
  }

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h1 className="text-3xl font-bold text-center mb-8 h-20">Porcentaje histórico de cobertura por vacuna y departamento</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className={getSelectStyle(selectedDepartamento)}
          onChange={(e) => setSelectedDepartamento(e.target.value)}
          value={selectedDepartamento}
        >
          {data?.departamentos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
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
      </ResponsiveContainer>

      <div className="mt-8 p-4 rounded-xl border border-gray-300 bg-white shadow text-center w-2/3 mx-auto">
        <p className="text-lg font-semibold">{mensaje}</p>
        {recomendacion && <p className="text-sm text-gray-600 mt-2">{recomendacion}</p>}
      </div>
    </section>
  );
}

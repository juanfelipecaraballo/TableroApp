import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useMemo } from 'react';
import type { ExcelData } from '../types';

interface DepartamentoPDET {
  departamento: string;
  cantidadMunicipiosPDET: number;
}
interface DepartamentosPDET {
  altoPDET: DepartamentoPDET[];
  bajoPDET: DepartamentoPDET[];
}

interface Props {
  data: ExcelData | null;
  departamentosPDET: DepartamentosPDET | null;
  vacuna: string;
}

function getCoberturas(
  data: ExcelData,
  departamentos: string[],
  anio: string,
  vacuna: string
): number[] {
  const sheet = data.dataBySheet[anio];
  if (!sheet) return [];
  return departamentos.map(dep => {
    const row = sheet.find((r) => r.DEPARTAMENTOS === dep);
    if (row) {
      const valorStr = row[vacuna];
      const valor = parseFloat(
        typeof valorStr === "string"
          ? valorStr.replace(",", ".")
          : valorStr ?? ""
      );
      if (!isNaN(valor)) return valor;
    }
    return null;
  }).filter((v): v is number => v !== null);
}

function getMean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function ComparacionMediaHistorica({ data, departamentosPDET, vacuna }: Props) {
  const lineData = useMemo(() => {
    if (!data || !departamentosPDET) return [];
    const anios = data.anios;
    const departamentosAlto = departamentosPDET.altoPDET.map(d => d.departamento);
    const departamentosBajo = departamentosPDET.bajoPDET.map(d => d.departamento);

    return anios.map(anio => {
      const alto = getCoberturas(data, departamentosAlto, anio, vacuna);
      const bajo = getCoberturas(data, departamentosBajo, anio, vacuna);
      return {
        anio,
        "PDET Alto": getMean(alto),
        "PDET Bajo": getMean(bajo)
      };
    });
  }, [data, departamentosPDET, vacuna]);

  if (!data || !departamentosPDET) return null;

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h2 className="text-3xl font-bold text-center mb-8">Evolución histórica de la cobertura promedio</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={lineData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="anio" />
          <YAxis domain={[80, 100]} tickFormatter={v => v + "%"} />
          <Tooltip formatter={(value: number) => value.toFixed(1) + "%"} />
          <Legend />
          <Line type="monotone" dataKey="PDET Alto" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="PDET Bajo" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Evolución anual de la cobertura promedio de la vacuna seleccionada, comparando departamentos con alta (≥5 municipios PDET) y baja concentración de municipios PDET.
      </div>
    </section>
  );
}
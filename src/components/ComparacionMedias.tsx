import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar } from 'recharts';
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

const ANIOS_ANTES = ["2014", "2015", "2016"];
const ANIOS_DESPUES = ["2017", "2018", "2019"];
const PERIODOS = [
  { key: "antes", label: "Antes del acuerdo (2014-2016)", anios: ANIOS_ANTES },
  { key: "despues", label: "Después del acuerdo (2017-2019)", anios: ANIOS_DESPUES },
  { key: "ambos", label: "Ambos periodos (2014-2019)", anios: [...ANIOS_ANTES, ...ANIOS_DESPUES] }
];

function getCoberturas(
  data: ExcelData,
  departamentos: string[],
  anios: string[],
  vacuna: string
): number[] {
  const valores: number[] = [];
  anios.forEach((anio) => {
    const sheet = data.dataBySheet[anio];
    if (!sheet) return;
    departamentos.forEach((dep) => {
      const row = sheet.find((r) => r.DEPARTAMENTOS === dep);
      if (row) {
        const valorStr = row[vacuna];
        const valor = parseFloat(
          typeof valorStr === "string"
            ? valorStr.replace(",", ".")
            : valorStr ?? ""
        );
        if (!isNaN(valor)) valores.push(valor);
      }
    });
  });
  return valores;
}

function getMean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function ComparacionMedias({ data, departamentosPDET, vacuna }: Props) {
  const barData = useMemo(() => {
    if (!data || !departamentosPDET) return [];
    const departamentosAlto = departamentosPDET.altoPDET.map(d => d.departamento);
    const departamentosBajo = departamentosPDET.bajoPDET.map(d => d.departamento);

    return PERIODOS.map(periodo => {
      const alto = getCoberturas(data, departamentosAlto, periodo.anios, vacuna);
      const bajo = getCoberturas(data, departamentosBajo, periodo.anios, vacuna);
      return {
        periodo: periodo.label,
        alto: getMean(alto),
        bajo: getMean(bajo),
        nAlto: alto.length,
        nBajo: bajo.length
      };
    });
  }, [data, departamentosPDET, vacuna]);

  if (!data || !departamentosPDET) return null;

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h2 className="text-3xl font-bold text-center mb-8">Comparación de medias por grupo y periodo</h2>
      <div className="flex flex-col md:flex-row gap-8 justify-center">
        {barData.map((period) => (
          <div key={period.periodo} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md flex-1">
            <h3 className="text-lg font-bold text-center mb-4">{period.periodo}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={[
                  { name: "PDET Alto", value: period.alto },
                  { name: "PDET Bajo", value: period.bajo }
                ]}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[85, 100]} />
                <Tooltip
                  formatter={(value: number) => value.toFixed(1) + "%"}
                  labelFormatter={label => label}
                />
                <Bar
                  dataKey="value"
                  fill="#8884d8"
                  barSize={40}
                  name="Promedio"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-500 text-center">
              <div>PDET Alto (n={period.nAlto}) &nbsp;|&nbsp; PDET Bajo (n={period.nBajo})</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

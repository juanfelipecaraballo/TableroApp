import type { ExcelData } from "../types";

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

const PERIODOS = [
  { key: "antes", label: "Antes del acuerdo (2014-2016)", anios: ["2014", "2015", "2016"] },
  { key: "despues", label: "Después del acuerdo (2017-2019)", anios: ["2017", "2018", "2019"] },
  { key: "ambos", label: "Ambos periodos (2014-2019)", anios: ["2014", "2015", "2016", "2017", "2018", "2019"] }
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

function getStats(values: number[]) {
  if (!values.length) return { min: null, max: null, mean: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, mean };
}

// Función para color comparativo
function getColorComparativo(meanAlto: number | null, meanBajo: number | null) {
  if (meanAlto === null || meanBajo === null) return "";
  const mejor = meanAlto > meanBajo ? meanAlto : meanBajo;
  if (mejor >= 95) return "text-green-600";
  if (mejor >= 80) return "text-orange-500";
  return "text-red-600";
}

// Mensaje comparativo
function getMsgComparativo(meanAlto: number | null, meanBajo: number | null) {
  if (meanAlto === null || meanBajo === null) return "";
  if (meanAlto >= 95 && meanBajo >= 95) {
    return "¡Excelente! Ambos grupos alcanzan la meta de cobertura.";
  }
  if (meanAlto >= 95 || meanBajo >= 95) {
    return `Solo el grupo de ${meanAlto >= 95 ? "alta" : "baja"} concentración PDET alcanza la meta de cobertura.`;
  }
  if (meanAlto > meanBajo) {
    return "La cobertura promedio es mayor en departamentos con alta concentración PDET.";
  }
  if (meanBajo > meanAlto) {
    return "La cobertura promedio es mayor en departamentos con baja concentración PDET.";
  }
  return "Ambos grupos presentan coberturas similares, pero por debajo de la meta recomendada.";
}

export default function EstadisticasGrupoPeriodo({ data, departamentosPDET, vacuna }: Props) {
  if (!data || !departamentosPDET) return null;

  const grupos = [
    { key: "alto", label: "Alta concentración PDET", departamentos: departamentosPDET.altoPDET.map(d => d.departamento) },
    { key: "bajo", label: "Baja concentración PDET", departamentos: departamentosPDET.bajoPDET.map(d => d.departamento) }
  ];

  // Calcula stats por grupo y periodo
  const resumen = PERIODOS.map(periodo => {
    const statsAlto = getStats(getCoberturas(data, grupos[0].departamentos, periodo.anios, vacuna));
    const statsBajo = getStats(getCoberturas(data, grupos[1].departamentos, periodo.anios, vacuna));
    return {
      periodo: periodo.label,
      statsAlto,
      statsBajo
    };
  });

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h2 className="text-3xl font-bold text-center mb-8">Cobertura mínima, máxima y promedio por grupo y periodo</h2>
      <div className="flex flex-col md:flex-row gap-8 justify-center">
        {resumen.map(periodo => (
          <div key={periodo.periodo} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md flex-1">
            <h3 className="text-lg font-bold text-center mb-4">{periodo.periodo}</h3>
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-gray-500">Promedio: </span>
                <span className={`font-bold ${getColorComparativo(periodo.statsAlto.mean, periodo.statsBajo.mean)}`}>
                  {periodo.statsBajo.mean !== null ? periodo.statsBajo.mean.toFixed(1) + "%" : "N/A"} (baja concentración PDET)
                </span>
                <span className="mx-2 text-gray-400">/</span>
                <span className={`font-bold ${getColorComparativo(periodo.statsAlto.mean, periodo.statsBajo.mean)}`}>
                  {periodo.statsAlto.mean !== null ? periodo.statsAlto.mean.toFixed(1) + "%" : "N/A"} (alta concentración PDET)
                </span>
              </div>
              <div>
                <span className="text-gray-500">Mínima: </span>
                <span className="font-bold">
                  {periodo.statsBajo.min !== null ? periodo.statsBajo.min.toFixed(1) + "%" : "N/A"} (baja)
                </span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-bold">
                  {periodo.statsAlto.min !== null ? periodo.statsAlto.min.toFixed(1) + "%" : "N/A"} (alta)
                </span>
              </div>
              <div>
                <span className="text-gray-500">Máxima: </span>
                <span className="font-bold">
                  {periodo.statsBajo.max !== null ? periodo.statsBajo.max.toFixed(1) + "%" : "N/A"} (baja)
                </span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="font-bold">
                  {periodo.statsAlto.max !== null ? periodo.statsAlto.max.toFixed(1) + "%" : "N/A"} (alta)
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {getMsgComparativo(periodo.statsAlto.mean, periodo.statsBajo.mean)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
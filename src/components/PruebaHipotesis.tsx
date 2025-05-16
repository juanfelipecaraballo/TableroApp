import { useMemo } from "react";
import { jStat } from "jstat";
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
  periodo: "antes" | "despues" | "ambos";
  vacuna: string;
}

const ANIOS_ANTES = ["2014", "2015", "2016"];
const ANIOS_DESPUES = ["2017", "2018", "2019"];

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

function getPeriodoLabel(periodo: "antes" | "despues" | "ambos") {
  if (periodo === "antes") return "Periodo previo al acuerdo de paz (2014-2016)";
  if (periodo === "despues") return "Periodo posterior al acuerdo de paz (2017-2019)";
  return "Ambos periodos (2014-2019)";
}

function getPregunta(periodo: "antes" | "despues" | "ambos", vacuna: string) {
  const vacunaLabel = vacuna === "SRP (T.V.) DE UN AÑO%" ? "triple viral de un año" : "triple viral de cinco años";
  if (periodo === "antes")
    return `¿Existía una diferencia en la cobertura de la vacuna ${vacunaLabel} entre departamentos con alta y baja concentración de municipios PDET antes del acuerdo de paz?`;
  if (periodo === "despues")
    return `¿Existe una diferencia en la cobertura de la vacuna ${vacunaLabel} entre departamentos con alta y baja concentración de municipios PDET después del acuerdo de paz?`;
  return `¿Existe una diferencia en la cobertura de la vacuna ${vacunaLabel} entre departamentos con alta y baja concentración de municipios PDET considerando todo el periodo 2014-2019?`;
}

export default function PruebaHipotesis({
  data,
  departamentosPDET,
  periodo,
  vacuna
}: Props) {
  const resultado = useMemo(() => {
    if (!data || !departamentosPDET) return null;

    const departamentosAlto = departamentosPDET.altoPDET.map((d) => d.departamento);
    const departamentosBajo = departamentosPDET.bajoPDET.map((d) => d.departamento);

    let anios: string[] = [];
    if (periodo === "antes") anios = ANIOS_ANTES;
    else if (periodo === "despues") anios = ANIOS_DESPUES;
    else anios = [...ANIOS_ANTES, ...ANIOS_DESPUES];

    // Grupos
    const coberturasAlto = getCoberturas(data, departamentosAlto, anios, vacuna);
    const coberturasBajo = getCoberturas(data, departamentosBajo, anios, vacuna);

    // Medias
    const meanAlto = jStat.mean(coberturasAlto);
    const meanBajo = jStat.mean(coberturasBajo);
    const diffMedias = meanAlto - meanBajo;

    // Prueba t de Welch (varianzas desiguales)
    const varAlto = jStat.variance(coberturasAlto, true);
    const varBajo = jStat.variance(coberturasBajo, true);
    const nAlto = coberturasAlto.length;
    const nBajo = coberturasBajo.length;
    const se = Math.sqrt(varAlto / nAlto + varBajo / nBajo);
    const tStatistic = (meanAlto - meanBajo) / se;
    // Grados de libertad de Welch
    const df =
      Math.pow(varAlto / nAlto + varBajo / nBajo, 2) /
      ((Math.pow(varAlto / nAlto, 2) / (nAlto - 1)) +
        (Math.pow(varBajo / nBajo, 2) / (nBajo - 1)));
    // Valor p (dos colas)
    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), df));
    // IC 95% para la diferencia de medias
    const tCrit = jStat.studentt.inv(1 - 0.025, df);
    const ciLow = diffMedias - tCrit * se;
    const ciHigh = diffMedias + tCrit * se;

    return {
      tStatistic,
      pValue,
      diffMedias,
      ciLow,
      ciHigh,
      meanAlto,
      meanBajo,
      nAlto,
      nBajo,
    };
  }, [data, departamentosPDET, periodo, vacuna]);

  if (!resultado) return null;

  const {
    tStatistic,
    pValue,
    diffMedias,
    ciLow,
    ciHigh,
    meanAlto,
    meanBajo,
    nAlto,
    nBajo,
  } = resultado;

  return (
    <section className="bg-zinc-100 m-16 p-8 rounded-2xl">
      <h2 className="text-2xl font-bold mb-2">Prueba de hipótesis: {getPregunta(periodo, vacuna)}</h2>
      <div className="mb-4 text-lg font-semibold text-indigo-700">{getPeriodoLabel(periodo)}</div>
      <div className="mb-6 text-sm text-gray-500">
        <b>Nota:</b> Se considera que un departamento tiene <b>alta concentración</b> de municipios PDET si cuenta con <b>5 o más municipios PDET</b>.
      </div>
      <div className="flex gap-8 mb-8">
        <div className="bg-white w-1/3 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <span className="text-gray-500 mb-2 font-bold">Estadístico t</span>
          <span className="text-4xl font-bold">{tStatistic.toFixed(2)}</span>
        </div>
        <div className="bg-white w-1/3 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <span className="text-gray-500 mb-2 font-bold">Valor p</span>
          <span className="text-4xl font-bold">{pValue.toExponential(2)}</span>
          <span className={pValue < 0.05 ? "text-green-600 font-semibold" : "text-gray-500"}>
            {pValue < 0.05 ? "Estadísticamente significativo" : "No significativo"}
          </span>
        </div>
        <div className="bg-white w-1/3 border border-gray-300 rounded-2xl p-4 shadow-md h-56 flex items-center justify-center flex-col">
          <span className="text-gray-500 mb-2 font-bold">Diferencia de medias</span>
          <span className="text-4xl font-bold">{diffMedias.toFixed(1)}%</span>
          <span className="text-gray-500 text-sm">
            IC 95%: [{ciLow.toFixed(1)}, {ciHigh.toFixed(1)}]
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">Interpretación</h3>
        <p className="text-gray-700">
          {pValue < 0.05
            ? `Existe una diferencia estadísticamente significativa (p = ${pValue.toExponential(2)}) en la cobertura de vacunación para la vacuna seleccionada entre departamentos con alta y baja concentración de municipios PDET. La diferencia promedio es de ${diffMedias.toFixed(1)} puntos porcentuales (IC 95%: ${ciLow.toFixed(1)}, ${ciHigh.toFixed(1)}), siendo mayor en el grupo con ${diffMedias > 0 ? "alta" : "baja"} concentración de municipios PDET.`
            : `No se encontró una diferencia estadísticamente significativa (p = ${pValue.toExponential(2)}) en la cobertura de vacunación para la vacuna seleccionada entre los grupos comparados.`}
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <div>
            <b>Media alta concentración:</b> {meanAlto.toFixed(1)}% (n={nAlto})
          </div>
          <div>
            <b>Media baja concentración:</b> {meanBajo.toFixed(1)}% (n={nBajo})
          </div>
        </div>
      </div>
    </section>
  );
}
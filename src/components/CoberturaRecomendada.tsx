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
  vacuna: string;
  departamentosPDET: DepartamentosPDET | null;
}

export default function CoberturaRecomendada({ data, vacuna, departamentosPDET }: Props) {
  // Usar el último año disponible
  const anio = data?.anios[data.anios.length - 1] ?? "";
  const departamentosBajos: { departamento: string; cobertura: number; esPDET: boolean }[] = [];

  // Construir set de departamentos PDET (alta y baja concentración)
  const departamentosPDETSet = new Set(
    [
      ...(departamentosPDET?.altoPDET ?? []),
    ].map(d => d.departamento?.toUpperCase())
  );

  if (data && anio) {
    const sheet = data.dataBySheet[anio];
    sheet.forEach(row => {
      const dep = row.DEPARTAMENTOS;
      if (!dep || dep === "TOTAL") return;
      const valorStr = row[vacuna];
      const cobertura = parseFloat(
        typeof valorStr === "string"
          ? valorStr.replace(",", ".")
          : valorStr ?? ""
      );
      // Es PDET si está en el set de departamentos PDET
      const esPDET = departamentosPDETSet.has(dep.toUpperCase());
      if (!isNaN(cobertura) && cobertura < 95) {
        departamentosBajos.push({ departamento: dep, cobertura, esPDET });
      }
    });
    departamentosBajos.sort((a, b) => a.cobertura - b.cobertura);
  }

  return (
    <section className="bg-zinc-100 p-8 rounded-2xl w-1/2">
      <h1 className="text-3xl font-bold text-center mb-8 h-20">
        Departamentos por debajo de la cobertura mínima recomendada según la OMS (95%)<br />
        <span className="text-lg font-normal text-gray-500">
          Vacuna {vacuna === "SRP (T.V.) DE UN AÑO%" ? "triple viral (SRP 1 año)" : "triple viral (SRP 5 años)"}, año {anio}
        </span>
      </h1>
      {departamentosBajos.length === 0 ? (
        <div className="bg-green-100 text-green-700 rounded-xl p-6 text-center font-semibold">
          ¡Todos los departamentos cumplen con la cobertura mínima recomendada!
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-300 shadow p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {departamentosBajos.map(({ departamento, cobertura, esPDET }) => (
              <div
                key={departamento}
                className="flex items-center justify-between px-4 py-2 border-b last:border-b-0"
              >
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  {departamento}
                  {esPDET && (
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded">
                      PDET
                    </span>
                  )}
                </span>
                <span className="font-bold text-red-700">{cobertura.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm text-gray-500 text-center">
            <b>Recomendación:</b> Refuerza las estrategias de vacunación en estos departamentos para alcanzar la meta del 95% recomendada por la OMS.
          </div>
        </div>
      )}
    </section>
  );
}

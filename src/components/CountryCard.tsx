import type { Country } from '../types/game';

interface CountryCardProps {
  country: Country;
  label: 'A' | 'B';
  allocation: number;
  onAllocationChange: (value: number) => void;
  disabled?: boolean;
}

export const CountryCard: React.FC<CountryCardProps> = ({
  country,
  label,
  allocation,
  onAllocationChange,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          País {label}: {country.name}
        </h3>
        <span className="text-3xl">🏳️</span>
      </div>
      
      <div className="mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 Investiga antes de invertir</h4>
          <p className="text-sm text-blue-700 mb-3">
            Busca información sobre riesgo político, crecimiento económico y oportunidades de inversión en {country.name}.
          </p>
          <div className="space-y-2">
            {country.riskAnalysisUrl && (
              <a
                href={country.riskAnalysisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 text-center transition-colors"
              >
                📊 Análisis de Riesgo País
              </a>
            )}
            {country.economicDataUrl && (
              <a
                href={country.economicDataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 text-center transition-colors"
              >
                📈 Datos Económicos Actuales
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inversión (USD)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={allocation}
          onChange={(e) => onAllocationChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="0"
        />
        <div className="text-sm text-gray-600 mt-1">
          ${allocation} USD
        </div>
      </div>
      
    </div>
  );
};
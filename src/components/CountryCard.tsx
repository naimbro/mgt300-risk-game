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
  const riskLevel = country.risk >= 7 ? '🔴 Alto' : country.risk >= 4 ? '🟡 Medio' : '🟢 Bajo';
  const riskColor = country.risk >= 7 ? 'text-red-600' : country.risk >= 4 ? 'text-yellow-600' : 'text-green-600';
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          País {label}: {country.name}
        </h3>
        <span className="text-3xl">🏳️</span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Riesgo Político:</span>
          <span className={`font-semibold ${riskColor}`}>
            {riskLevel} ({country.risk.toFixed(1)}/10)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">📈 Crecimiento:</span>
          <span className="font-semibold text-blue-600">
            {(country.growth * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">💼 Retorno Base:</span>
          <span className="font-semibold">
            {(country.baseReturn * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inversión (USD)
        </label>
        <input
          type="number"
          min="0"
          max="100000000"
          step="1000000"
          value={allocation}
          onChange={(e) => onAllocationChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="0"
        />
        <div className="text-sm text-gray-600 mt-1">
          ${allocation.toLocaleString()}
        </div>
      </div>
      
      {country.sources && (
        <div className="flex gap-2">
          {country.sources.riskUrl && (
            <a
              href={country.sources.riskUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Ver análisis de riesgo
            </a>
          )}
          {country.sources.growthUrl && (
            <a
              href={country.sources.growthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Ver datos de crecimiento
            </a>
          )}
        </div>
      )}
    </div>
  );
};
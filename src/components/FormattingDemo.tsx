'use client';

import { useFormatter } from 'next-intl';

/**
 * Componente demonstrando formatação programática
 * (sem usar ICU syntax nas mensagens)
 */
export function FormattingDemo() {
  const format = useFormatter();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Formatação Programática</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formatação de Data */}
        <div className="bg-yellow-50 p-4 rounded">
          <h4 className="font-semibold text-sm mb-2">Datas</h4>
          <div className="space-y-2 text-sm font-mono">
            <p>
              <span className="text-gray-600">Curta:</span>{' '}
              {format.dateTime(new Date(), 'short')}
            </p>
            <p>
              <span className="text-gray-600">Média:</span>{' '}
              {format.dateTime(new Date(), 'medium')}
            </p>
            <p>
              <span className="text-gray-600">Completa:</span>{' '}
              {format.dateTime(new Date(), 'full')}
            </p>
          </div>
        </div>

        {/* Formatação de Números */}
        <div className="bg-orange-50 p-4 rounded">
          <h4 className="font-semibold text-sm mb-2">Números</h4>
          <div className="space-y-2 text-sm font-mono">
            <p>
              <span className="text-gray-600">Decimal:</span>{' '}
              {format.number(1234.567, 'decimal')}
            </p>
            <p>
              <span className="text-gray-600">Moeda:</span>{' '}
              {format.number(1234.56, 'currency')}
            </p>
            <p>
              <span className="text-gray-600">Percentual:</span>{' '}
              {format.number(0.85, 'percent')}
            </p>
          </div>
        </div>

        {/* Hora Relativa */}
        <div className="bg-pink-50 p-4 rounded">
          <h4 className="font-semibold text-sm mb-2">Tempo Relativo</h4>
          <div className="space-y-2 text-sm font-mono">
            <p>
              {format.relativeTime(new Date(Date.now() - 3600000), new Date())}
            </p>
            <p>
              {format.relativeTime(new Date(Date.now() - 86400000), new Date())}
            </p>
            <p>
              {format.relativeTime(new Date(Date.now() + 604800000), new Date())}
            </p>
          </div>
        </div>

        {/* Range de Datas */}
        <div className="bg-teal-50 p-4 rounded">
          <h4 className="font-semibold text-sm mb-2">Range de Datas</h4>
          <p className="text-sm font-mono">
            {format.dateTimeRange(
              new Date(2025, 0, 15),
              new Date(2025, 0, 31),
              'medium'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

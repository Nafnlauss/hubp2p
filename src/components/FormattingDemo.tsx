'use client'

import { useFormatter } from 'next-intl'

/**
 * Componente demonstrando formatação programática
 * (sem usar ICU syntax nas mensagens)
 */
export function FormattingDemo() {
  const format = useFormatter()

  return (
    <div>
      <h3 className="mb-4 text-xl font-semibold">Formatação Programática</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Formatação de Data */}
        <div className="rounded bg-yellow-50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Datas</h4>
          <div className="space-y-2 font-mono text-sm">
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
        <div className="rounded bg-orange-50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Números</h4>
          <div className="space-y-2 font-mono text-sm">
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
        <div className="rounded bg-pink-50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Tempo Relativo</h4>
          <div className="space-y-2 font-mono text-sm">
            <p>
              {format.relativeTime(
                new Date(Date.now() - 3_600_000),
                new Date(),
              )}
            </p>
            <p>
              {format.relativeTime(
                new Date(Date.now() - 86_400_000),
                new Date(),
              )}
            </p>
            <p>
              {format.relativeTime(
                new Date(Date.now() + 604_800_000),
                new Date(),
              )}
            </p>
          </div>
        </div>

        {/* Range de Datas */}
        <div className="rounded bg-teal-50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Range de Datas</h4>
          <p className="font-mono text-sm">
            {format.dateTimeRange(
              new Date(2025, 0, 15),
              new Date(2025, 0, 31),
              'medium',
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

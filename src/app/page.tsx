import { useTranslations } from 'next-intl';
import { FormattingDemo } from '@/components/FormattingDemo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/**
 * Página inicial com demonstração de i18n
 * Usa Client Component para hooks de tradução
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <PageTitle />
          <LanguageSwitcher />
        </header>

        {/* Conteúdo Principal */}
        <section className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <WelcomeSection />
          <FormattingDemo />
          <PluralFormDemo />
          <DateTimeFormattingDemo />
          <NumberFormattingDemo />
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600">
          <p>Plataforma P2P - Internacionalizada com next-intl</p>
        </footer>
      </div>
    </main>
  );
}

function PageTitle() {
  const t = useTranslations('common');
  return (
    <h1 className="text-4xl font-bold text-gray-900 mb-2">
      {t('appName')}
    </h1>
  );
}

function WelcomeSection() {
  const t = useTranslations('messages');
  return (
    <div className="border-l-4 border-indigo-500 pl-6">
      <h2 className="text-2xl font-semibold mb-4">
        {t('greeting', { name: 'Usuário' })}
      </h2>
      <p className="text-gray-700">
        Esta é uma demonstração completa de internacionalização com next-intl no Next.js 15.
      </p>
    </div>
  );
}

function PluralFormDemo() {
  const t = useTranslations('messages');
  const counts = [0, 1, 5];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Pluralização (ICU Format)</h3>
      <div className="grid grid-cols-3 gap-4">
        {counts.map((count) => (
          <div key={count} className="bg-blue-50 p-4 rounded">
            <p className="font-mono text-sm text-blue-900">
              {t('itemCount', { count })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DateTimeFormattingDemo() {
  const t = useTranslations('messages');
  const now = new Date();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Formatação de Datas</h3>
      <div className="space-y-3">
        <p className="font-mono text-sm bg-green-50 p-3 rounded">
          {t('date', { date: now })}
        </p>
        <p className="font-mono text-sm bg-green-50 p-3 rounded">
          {t('time', { time: now })}
        </p>
        <p className="font-mono text-sm bg-green-50 p-3 rounded">
          {t('dateRange', {
            startDate: new Date(2025, 0, 1),
            endDate: new Date(2025, 11, 31),
          })}
        </p>
      </div>
    </div>
  );
}

function NumberFormattingDemo() {
  const t = useTranslations('messages');

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Formatação de Números</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 p-4 rounded">
          <p className="font-mono text-sm text-purple-900">
            {t('price', { amount: 1299.99 })}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="font-mono text-sm text-purple-900">
            {t('discount', { percent: 0.15 })}
          </p>
        </div>
      </div>
    </div>
  );
}

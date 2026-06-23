import { Sidebar } from '@/components/Sidebar';
import { PersonaProvider } from '@/components/PersonaProvider';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';
import { BackgroundProvider } from '@/components/BackgroundProvider';
import { AppBackground } from '@/components/AppBackground';
import { BackgroundControl } from '@/components/BackgroundControl';

// Layout do painel: fundo global (marca d'água) + sidebar + barra de topo (fundo + switcher).
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundProvider>
      <PersonaProvider>
        <AppBackground />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-end gap-3 border-b border-nude bg-paper/60 px-8 py-3">
              <BackgroundControl />
              <PersonaSwitcher />
            </header>
            <main className="px-8 py-6 max-w-6xl">{children}</main>
          </div>
        </div>
      </PersonaProvider>
    </BackgroundProvider>
  );
}

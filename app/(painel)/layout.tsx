import { Sidebar } from '@/components/Sidebar';
import { PersonaProvider } from '@/components/PersonaProvider';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';

// Layout do painel: sidebar + barra de topo com o switcher de persona (conta ativa).
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-end border-b border-nude bg-paper/60 px-8 py-3">
            <PersonaSwitcher />
          </header>
          <main className="px-8 py-6 max-w-6xl">{children}</main>
        </div>
      </div>
    </PersonaProvider>
  );
}

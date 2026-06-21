import { Sidebar } from '@/components/Sidebar';

// Layout do painel: sidebar fixa + área de conteúdo. Baseado no IARA_Painel_Mockup.html.
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-6 max-w-6xl">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Navegação do painel — espelha o sidebar do IARA_Painel_Mockup.html.
const NAV: { href: string; label: string; icon: string; soon?: boolean }[] = [
  { href: '/visao-geral', label: 'Visão Geral', icon: '▦' },
  { href: '/gerar', label: 'Gerar Conteúdo', icon: '✶' },
  { href: '/fila', label: 'Fila de Aprovação', icon: '☑' },
  { href: '/calendario', label: 'Calendário', icon: '▤' },
  { href: '/monetizacao', label: 'Monetização', icon: '◎' },
  { href: '/analytics', label: 'Analytics', icon: '◷' },
  { href: '/persona', label: 'Persona', icon: '☺' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-nude bg-paper px-3 py-5 flex flex-col gap-1">
      <div className="px-3 pb-5">
        <span className="text-terracota font-bold tracking-widest">IARA</span>
        <p className="text-xs text-ink/50">Isabella Souza</p>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                active
                  ? 'bg-terracota text-paper'
                  : 'text-ink/80 hover:bg-nude-light',
              ].join(' ')}
            >
              <span className="w-4 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="text-[10px] uppercase opacity-60">soon</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pt-4 text-[10px] text-ink/40">
        Conteúdo gerado por IA · Conar · LGPD
      </div>
    </aside>
  );
}

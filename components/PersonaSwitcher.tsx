'use client';

// Switcher de PERSONA ATIVA, fixo no topo do painel. Trocar aqui muda o contexto
// de todas as telas (gerar, fila, calendário, analytics, monetização, engajamento).
import Link from 'next/link';
import { useActivePersona } from './PersonaProvider';

export function PersonaSwitcher() {
  const { personas, activeId, setActiveId, loading } = useActivePersona();

  if (loading) return <span className="text-sm text-ink/40">carregando contas…</span>;
  if (personas.length === 0)
    return (
      <Link href="/persona" className="text-sm font-medium text-terracota">
        + criar primeira persona
      </Link>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink/50">Conta ativa</span>
      <select
        value={activeId ?? ''}
        onChange={(e) => setActiveId(e.target.value)}
        className="rounded-md border border-nude bg-white px-3 py-1.5 text-sm font-semibold text-ink"
        aria-label="Trocar persona ativa"
      >
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Link href="/contas" className="text-xs text-ink/50 hover:text-terracota">
        gerenciar →
      </Link>
    </div>
  );
}

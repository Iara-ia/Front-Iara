'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import type { AnalyticsOverviewDTO } from '@iara/contracts';

type Overview = AnalyticsOverviewDTO & {
  naFila: number;
  agendados: number;
  contasConectadas: number;
};

// Sprint 3 — Analytics. Métricas agregadas dos posts publicados (via InsightsProvider).
export default function AnalyticsPage() {
  const { active: persona } = useActivePersona();
  const [o, setO] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setO(null);
    api
      .analyticsOverview(persona?.id)
      .then(setO)
      .catch((e) => setError((e as Error).message));
  }, [persona?.id]);

  if (error) return <ErrWrap msg={error} />;
  if (!o)
    return (
      <>
        <PageHeader title="Analytics" subtitle="Carregando…" />
        <div className="h-40 animate-pulse rounded-md border border-nude bg-nude-light/40" />
      </>
    );

  return (
    <>
      <PageHeader title="Analytics" subtitle="Desempenho agregado dos posts publicados." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Seguidores" value={fmt(o.followers)} />
        <Stat label="Alcance (publicados)" value={fmt(o.reach)} />
        <Stat label="Engajamento" value={`${o.engagementRate}%`} />
        <Stat label="Posts publicados" value={fmt(o.perPost.length)} />
        <Stat label="Na fila de aprovação" value={fmt(o.naFila)} />
        <Stat label="Agendados" value={fmt(o.agendados)} />
        <Stat label="Contas conectadas" value={fmt(o.contasConectadas)} />
      </div>

      <h2 className="mt-8 mb-2 text-sm font-semibold">Por post</h2>
      {o.perPost.length === 0 ? (
        <p className="text-xs text-ink/40">Nenhum post publicado ainda. Agende no Calendário.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-md border border-nude bg-white text-xs">
          <thead className="bg-nude-light/60 text-ink/60">
            <tr>
              <th className="px-3 py-2 text-left">Post</th>
              <th className="px-3 py-2 text-right">Alcance</th>
              <th className="px-3 py-2 text-right">Curtidas</th>
              <th className="px-3 py-2 text-right">Comentários</th>
            </tr>
          </thead>
          <tbody>
            {o.perPost.map((p) => (
              <tr key={p.contentItemId} className="border-t border-nude">
                <td className="px-3 py-2 font-mono text-ink/60">{p.contentItemId.slice(-8)}</td>
                <td className="px-3 py-2 text-right">{fmt(p.reach)}</td>
                <td className="px-3 py-2 text-right">{fmt(p.likes)}</td>
                <td className="px-3 py-2 text-right">{fmt(p.comments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[11px] text-ink/40">
        Métricas simuladas (determinísticas). Ligam no Instagram/TikTok real via Ayrshare/Graph
        quando a chave/conta existir.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-nude-light/50 p-4">
      <p className="text-[13px] text-ink/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-terracota">{value}</p>
    </div>
  );
}
function ErrWrap({ msg }: { msg: string }) {
  return (
    <>
      <PageHeader title="Analytics" />
      <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{msg}</p>
    </>
  );
}
function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n);
}

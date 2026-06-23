'use client';

// "Minhas Contas" — cada card é uma PERSONA (influencer) com suas redes e números.
// Gerenciar → define a persona ativa e leva ao painel dela.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import { PLATFORMS, platformMeta } from '@/lib/platforms';
import type { SocialAccountDTO } from '@iara/contracts';

export default function ContasPage() {
  const { personas, activeId, setActiveId, loading } = useActivePersona();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>([]);
  const [stats, setStats] = useState<Record<string, { followers: number; agendados: number }>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const accs = await api.listSocial();
        setAccounts(accs);
        const entries = await Promise.all(
          personas.map(async (p) => {
            const ov = await api.analyticsOverview(p.id);
            return [p.id, { followers: ov.followers, agendados: ov.agendados }] as const;
          }),
        );
        setStats(Object.fromEntries(entries));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [loading, personas]);

  function gerenciar(id: string) {
    setActiveId(id);
    router.push('/visao-geral');
  }

  const netsOf = (personaId: string) =>
    accounts.filter((a) => a.personaId === personaId && a.status === 'CONNECTED').map((a) => a.platform);

  return (
    <>
      <PageHeader
        title="Minhas Contas"
        subtitle="Cada conta é uma influencer (persona) com suas próprias redes, conteúdo e números."
      />
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personas.map((p) => {
          const nets = netsOf(p.id);
          const st = stats[p.id];
          const ativa = p.id === activeId;
          return (
            <div
              key={p.id}
              className={[
                'rounded-lg border p-5 flex flex-col gap-3',
                ativa ? 'border-terracota ring-1 ring-terracota' : 'border-nude',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-terracota/15 text-terracota flex items-center justify-center font-bold">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{p.name}</p>
                  <p className="text-[11px] text-ink/50">
                    {p.status === 'ACTIVE' ? '● ativa' : p.status === 'PAUSED' ? '⏸ pausada' : '○ rascunho'}
                    {ativa && ' · gerenciando agora'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {(p.niches ?? []).slice(0, 4).map((n) => (
                  <span key={n} className="rounded bg-nude-light px-2 py-0.5 text-[11px] text-ink/70">
                    {n}
                  </span>
                ))}
                {(p.niches?.length ?? 0) === 0 && (
                  <span className="text-[11px] text-ink/40">sem nichos definidos</span>
                )}
              </div>

              <div>
                <p className="text-[11px] text-ink/40 mb-1">Redes</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((pl) => {
                    const on = nets.includes(pl.key);
                    return (
                      <span
                        key={pl.key}
                        title={pl.label + (on ? ' (conectada)' : '')}
                        className={[
                          'inline-flex h-6 w-6 items-center justify-center rounded text-xs',
                          on
                            ? 'bg-oliva/20 text-oliva-dark'
                            : 'bg-nude-light text-ink/30',
                        ].join(' ')}
                      >
                        {pl.icon}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <span>
                  <strong>{st ? st.followers.toLocaleString('pt-BR') : '—'}</strong>{' '}
                  <span className="text-ink/40 text-xs">seguidores</span>
                </span>
                <span>
                  <strong>{st ? st.agendados : '—'}</strong>{' '}
                  <span className="text-ink/40 text-xs">agendados</span>
                </span>
              </div>

              <button
                onClick={() => gerenciar(p.id)}
                className="mt-auto rounded-md bg-terracota px-4 py-2 text-sm font-medium text-paper hover:bg-terracota-dark"
              >
                {ativa ? 'Abrir painel' : 'Gerenciar esta conta'}
              </button>
            </div>
          );
        })}

        <Link
          href="/persona"
          className="rounded-lg border border-dashed border-nude p-5 flex flex-col items-center justify-center text-center text-ink/50 hover:border-terracota hover:text-terracota min-h-[220px]"
        >
          <span className="text-3xl">＋</span>
          <span className="mt-2 text-sm font-medium">Criar nova influencer</span>
        </Link>
      </div>
    </>
  );
}

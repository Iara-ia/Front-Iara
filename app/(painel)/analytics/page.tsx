'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import type {
  AnalyticsOverviewDTO,
  AudienceDemographics,
  LearningInsightsDTO,
  DemographicSlice,
} from '@iara/contracts';

type Overview = AnalyticsOverviewDTO & {
  naFila: number;
  agendados: number;
  contasConectadas: number;
};

// Sprint 3 — Analytics. Métricas agregadas + perfil da audiência (demografia) + loop de aprendizado.
export default function AnalyticsPage() {
  const { active: persona } = useActivePersona();
  const [o, setO] = useState<Overview | null>(null);
  const [aud, setAud] = useState<AudienceDemographics | null>(null);
  const [learn, setLearn] = useState<LearningInsightsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setO(null);
    setAud(null);
    setLearn(null);
    const pid = persona?.id;
    api.analyticsOverview(pid).then(setO).catch((e) => setError((e as Error).message));
    api.analyticsAudience(pid).then(setAud).catch(() => {});
    api.analyticsLearning(pid).then(setLearn).catch(() => {});
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
      <PageHeader title="Analytics" subtitle="Desempenho, perfil do público e aprendizado da Isabella." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Seguidores" value={fmt(o.followers)} />
        <Stat label="Alcance (publicados)" value={fmt(o.reach)} />
        <Stat label="Engajamento" value={`${o.engagementRate}%`} />
        <Stat label="Posts publicados" value={fmt(o.perPost.length)} />
        <Stat label="Na fila de aprovação" value={fmt(o.naFila)} />
        <Stat label="Agendados" value={fmt(o.agendados)} />
        <Stat label="Contas conectadas" value={fmt(o.contasConectadas)} />
      </div>

      {/* ---- Perfil da audiência (demografia) ---- */}
      <SectionTitle>Perfil do público</SectionTitle>
      {!aud ? (
        <SkeletonBlock />
      ) : aud.source === 'unavailable' ? (
        <Empty msg={aud.note ?? 'Demografia ainda indisponível.'} />
      ) : (
        <>
          {aud.followerGrowth.length > 0 && (
            <div className="mb-4 rounded-md border border-nude bg-white p-4">
              <p className="mb-2 text-xs font-medium text-ink/60">Crescimento de seguidores (14 dias)</p>
              <Sparkline data={aud.followerGrowth.map((p) => p.followers)} />
              <div className="mt-1 flex justify-between text-[10px] text-ink/40">
                <span>{aud.followerGrowth[0]?.date}</span>
                <span>+{fmt((aud.followerGrowth.at(-1)?.followers ?? 0) - (aud.followerGrowth[0]?.followers ?? 0))} no período</span>
                <span>{aud.followerGrowth.at(-1)?.date}</span>
              </div>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <BarCard title="Gênero" slices={aud.gender} />
            <BarCard title="Faixa etária" slices={aud.ageRanges} />
            <BarCard title="Principais cidades" slices={aud.topCities} />
            <BarCard title="Principais países" slices={aud.topCountries} />
          </div>
          {aud.source === 'mock' && (
            <p className="mt-2 text-[11px] text-ink/40">
              {aud.note ?? 'Dados de exemplo — acendem com o Instagram real quando a conta conectar.'}
            </p>
          )}
        </>
      )}

      {/* ---- Loop de aprendizado (o que mais engaja) ---- */}
      <SectionTitle>O que a Isabella está aprendendo</SectionTitle>
      {!learn ? (
        <SkeletonBlock />
      ) : learn.rankings.length === 0 ? (
        <Empty msg="Sem posts publicados ainda. Quando a Isabella publicar, ela mede o que mais engaja e passa a priorizar esses temas." />
      ) : (
        <div className="rounded-md border border-nude bg-white p-4">
          <p className="mb-3 text-xs text-ink/60">
            Ranking de temas por engajamento (dos {learn.sampleSize} posts publicados):
          </p>
          <div className="space-y-2">
            {learn.rankings.map((r, i) => (
              <div key={r.pilar} className="flex items-center gap-2">
                <span className="w-5 text-right text-[11px] text-ink/40">{i + 1}º</span>
                <span className="w-28 shrink-0 truncate text-xs font-medium capitalize">{pretty(r.pilar)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-nude-light">
                  <div
                    className="h-full rounded-full bg-terracota"
                    style={{ width: `${Math.max(4, r.share)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-[11px] text-ink/50">
                  {r.engagementRate}% · {r.posts}p
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 mb-1 text-xs font-medium text-ink/70">Mix sugerido pra próxima leva</p>
          <div className="flex flex-wrap gap-1.5">
            {learn.suggestedMix.map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="rounded-full bg-oliva/15 px-2 py-0.5 text-[11px] capitalize text-oliva-dark"
              >
                {pretty(p)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink/40">
            {learn.note ??
              'Na tela “Gerar conteúdo”, ligue o modo “Priorizar o que mais engaja” pra usar essa recomendação automaticamente.'}
          </p>
        </div>
      )}

      {/* ---- Desempenho por post ---- */}
      <SectionTitle>Por post</SectionTitle>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-2 text-sm font-semibold">{children}</h2>;
}

// Card com barras horizontais (percentual). Reaproveitado por gênero/idade/cidade/país.
function BarCard({ title, slices }: { title: string; slices: DemographicSlice[] }) {
  const max = Math.max(1, ...slices.map((s) => s.value));
  return (
    <div className="rounded-md border border-nude bg-white p-4">
      <p className="mb-3 text-xs font-medium text-ink/60">{title}</p>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-[11px] text-ink/70">{s.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-nude-light">
              <div
                className="h-full rounded-full bg-terracota/80"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] text-ink/50">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini-gráfico de linha (SVG) para o crescimento de seguidores.
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-10 w-full">
      <polyline points={pts} fill="none" stroke="var(--tw-terracota, #B85C38)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SkeletonBlock() {
  return <div className="h-32 animate-pulse rounded-md border border-nude bg-nude-light/40" />;
}
function Empty({ msg }: { msg: string }) {
  return <p className="rounded-md border border-nude bg-white px-4 py-3 text-xs text-ink/50">{msg}</p>;
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
// Rótulo amigável de um pilar/slug (ex.: 'saude-mental' → 'saude mental').
function pretty(slug: string) {
  return slug.replace(/-/g, ' ');
}

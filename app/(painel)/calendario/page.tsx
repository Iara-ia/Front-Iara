'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import { PLATFORMS } from '@/lib/platforms';
import { SocialPlatform } from '@iara/contracts';
import type { ContentItemDTO } from '@iara/contracts';

// Sprint 3 — Calendário/Agendar. Lista itens APROVADOS para agendar (data/hora + plataformas);
// ao chegar a hora, o worker publica sozinho (status vai para PUBLICADO). Mostra também os
// AGENDADOS e PUBLICADOS.
const PLATAFORMAS: SocialPlatform[] = PLATFORMS.map((p) => p.key);

export default function CalendarioPage() {
  const { active: persona } = useActivePersona();
  const [items, setItems] = useState<ContentItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);

  async function runAuto() {
    setRunning(true);
    setAutoMsg(null);
    try {
      const r = await api.runAutopilot();
      setAutoMsg(
        `Piloto automático: ${r.aprovados} aprovados e agendados, ${r.ignorados.length} retidos pelos gates.`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function load() {
    setError(null);
    try {
      const pid = persona?.id;
      const [aprov, agend, pub] = await Promise.all([
        api.listContent({ status: 'APROVADO', personaId: pid }),
        api.listContent({ status: 'AGENDADO', personaId: pid }),
        api.listContent({ status: 'PUBLICADO', personaId: pid }),
      ]);
      setItems([...aprov, ...agend, ...pub]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // reflete a publicação automática
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.id]);

  const aprovados = items.filter((i) => i.status === 'APROVADO');
  const agendados = items.filter((i) => i.status === 'AGENDADO');
  const publicados = items.filter((i) => i.status === 'PUBLICADO');

  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle="Agende os aprovados — a Isabella publica sozinha na hora marcada."
      />
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={runAuto}
          disabled={running}
          className="rounded-md bg-terracota px-4 py-2 text-sm text-paper font-medium hover:bg-terracota-dark disabled:opacity-60"
        >
          {running ? 'Rodando…' : '⚡ Rodar piloto automático'}
        </button>
        <span className="text-xs text-ink/50">
          Aprova os que passam nos gates e agenda 1/dia. O resto fica para revisão.
        </span>
      </div>
      {autoMsg && (
        <p className="mb-4 rounded-md bg-oliva/15 px-4 py-2 text-sm text-oliva-dark">{autoMsg}</p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-md border border-nude bg-nude-light/40" />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Prontos para agendar ({aprovados.length})</h2>
            {aprovados.length === 0 ? (
              <p className="text-xs text-ink/40">
                Nenhum item aprovado. Aprove na Fila para poder agendar.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {aprovados.map((it) => (
                  <Agendador key={it.id} item={it} onDone={load} />
                ))}
              </div>
            )}
          </section>

          <Lista titulo={`Agendados (${agendados.length})`} itens={agendados} tipo="agendado" />
          <Lista titulo={`Publicados (${publicados.length})`} itens={publicados} tipo="publicado" />
        </div>
      )}
    </>
  );
}

function Agendador({ item, onDone }: { item: ContentItemDTO; onDone: () => void }) {
  const [when, setWhen] = useState(defaultWhen());
  const [plats, setPlats] = useState<SocialPlatform[]>([SocialPlatform.INSTAGRAM]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(p: SocialPlatform) {
    setPlats((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }
  async function agendar() {
    if (!plats.length) {
      setErr('Escolha ao menos uma plataforma.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.scheduleContent(item.id, {
        scheduleAt: new Date(when).toISOString(),
        platforms: plats,
      });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-nude bg-white p-4 space-y-2">
      <p className="text-sm font-medium">{item.pilar ?? 'conteúdo'}</p>
      <p className="line-clamp-2 text-xs text-ink/60">{item.caption ?? '—'}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="rounded-md border border-nude px-2 py-1.5 text-xs"
        />
        {PLATAFORMAS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            className={[
              'rounded-full px-3 py-1 text-xs border',
              plats.includes(p)
                ? 'bg-terracota text-paper border-terracota'
                : 'bg-white text-ink border-nude',
            ].join(' ')}
          >
            {p}
          </button>
        ))}
        <button
          onClick={agendar}
          disabled={busy}
          className="rounded-md bg-oliva px-3 py-1.5 text-xs text-paper disabled:opacity-60"
        >
          {busy ? 'Agendando…' : 'Agendar'}
        </button>
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}
    </div>
  );
}

function Lista({
  titulo,
  itens,
  tipo,
}: {
  titulo: string;
  itens: ContentItemDTO[];
  tipo: 'agendado' | 'publicado';
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{titulo}</h2>
      {itens.length === 0 ? (
        <p className="text-xs text-ink/40">Nada por aqui ainda.</p>
      ) : (
        <ul className="divide-y divide-nude rounded-md border border-nude bg-white">
          {itens.map((it) => (
            <li key={it.id} className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="text-ink/80">{it.pilar ?? 'conteúdo'}</span>
              <span className="text-ink/50">
                {tipo === 'agendado'
                  ? it.scheduleAt
                    ? new Date(it.scheduleAt).toLocaleString('pt-BR')
                    : '—'
                  : Object.keys(it.externalPostIds ?? {}).join(', ') || 'publicado'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function defaultWhen() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // +1h
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

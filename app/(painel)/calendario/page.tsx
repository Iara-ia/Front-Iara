'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import { PlatformIcon } from '@/components/PlatformIcon';
import { PostThumb } from '@/components/PostThumb';
import { ContentPreviewModal } from '@/components/ContentPreviewModal';
import { PLATFORMS } from '@/lib/platforms';
import { SocialPlatform } from '@iara/contracts';
import type { ContentItemDTO } from '@iara/contracts';

// Sprint 3 — Calendário/Agendar. Lista itens APROVADOS para agendar (data/hora + plataformas);
// ao chegar a hora, o worker publica sozinho. Agora VISUAL: capa, "hoje" e preview grande.
const PLATAFORMAS: SocialPlatform[] = PLATFORMS.map((p) => p.key);

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export default function CalendarioPage() {
  const { active: persona } = useActivePersona();
  const [items, setItems] = useState<ContentItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ list: ContentItemDTO[]; index: number } | null>(null);

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

  // "Publicações de hoje": agendados de hoje (vão sair) + publicados hoje (já saíram).
  const hoje = [
    ...agendados.filter((i) => isToday(i.scheduleAt)),
    ...publicados.filter((i) => isToday(i.scheduleAt ?? i.approvedAt ?? i.createdAt)),
  ].sort((a, b) => (a.scheduleAt ?? '').localeCompare(b.scheduleAt ?? ''));
  const proximos = agendados.filter((i) => !isToday(i.scheduleAt));

  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle="O que a Isabella publica — clique em qualquer card para ver a imagem e a legenda."
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
            <h2 className="mb-2 text-sm font-semibold">📅 Publicações de hoje ({hoje.length})</h2>
            {hoje.length === 0 ? (
              <p className="rounded-md border border-dashed border-nude bg-white/60 px-4 py-3 text-xs text-ink/50">
                Nada marcado para hoje. Rode o <strong>piloto automático</strong> acima, ou agende um
                aprovado abaixo.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {hoje.map((it, i) => (
                  <PostCard
                    key={it.id}
                    item={it}
                    tipo={it.status === 'PUBLICADO' ? 'publicado' : 'hoje'}
                    onOpen={() => setPreview({ list: hoje, index: i })}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Prontos para agendar ({aprovados.length})</h2>
            {aprovados.length === 0 ? (
              <p className="text-xs text-ink/40">
                Nenhum item aprovado. Aprove na Fila para poder agendar.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {aprovados.map((it, i) => (
                  <Agendador
                    key={it.id}
                    item={it}
                    onDone={load}
                    onOpen={() => setPreview({ list: aprovados, index: i })}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Próximos agendados ({proximos.length})</h2>
            {proximos.length === 0 ? (
              <p className="text-xs text-ink/40">Nada agendado além de hoje.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {proximos.map((it, i) => (
                  <PostCard
                    key={it.id}
                    item={it}
                    tipo="agendado"
                    onOpen={() => setPreview({ list: proximos, index: i })}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Publicados ({publicados.length})</h2>
            {publicados.length === 0 ? (
              <p className="text-xs text-ink/40">Nada publicado ainda.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {publicados.slice(0, 12).map((it, i, arr) => (
                  <PostCard
                    key={it.id}
                    item={it}
                    tipo="publicado"
                    onOpen={() => setPreview({ list: arr, index: i })}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {preview && (
        <ContentPreviewModal
          list={preview.list}
          index={preview.index}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

function PostCard({
  item,
  onOpen,
  tipo,
}: {
  item: ContentItemDTO;
  onOpen: () => void;
  tipo: 'hoje' | 'agendado' | 'publicado';
}) {
  const quando = item.scheduleAt
    ? new Date(item.scheduleAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md border border-nude bg-white/85 p-3 text-left hover:border-terracota"
    >
      <PostThumb item={item} size={56} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.pilar ?? 'conteúdo'}</p>
        <p className="line-clamp-1 text-xs text-ink/60">{item.caption ?? '—'}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink/50">
          {item.platforms?.slice(0, 5).map((p) => (
            <PlatformIcon key={p} platform={p} size={13} />
          ))}
          <span className="ml-1">
            {tipo === 'publicado' ? '✓ publicado' : tipo === 'hoje' ? `hoje ${quando.slice(-5)}` : quando}
          </span>
        </div>
      </div>
    </button>
  );
}

function Agendador({
  item,
  onDone,
  onOpen,
}: {
  item: ContentItemDTO;
  onDone: () => void;
  onOpen: () => void;
}) {
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
    <div className="rounded-md border border-nude bg-white/85 p-4">
      <div className="flex gap-3">
        <PostThumb item={item} size={56} onClick={onOpen} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.pilar ?? 'conteúdo'}</p>
          <p className="line-clamp-2 text-xs text-ink/60">{item.caption ?? '—'}</p>
          <button onClick={onOpen} className="mt-1 text-[11px] text-terracota hover:underline">
            ver imagem + legenda
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pt-1">
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
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border',
              plats.includes(p)
                ? 'bg-terracota text-paper border-terracota'
                : 'bg-white text-ink border-nude',
            ].join(' ')}
          >
            <PlatformIcon platform={p} size={12} /> {p}
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
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}

function defaultWhen() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // +1h
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

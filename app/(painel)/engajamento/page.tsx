'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import { SocialPlatform } from '@iara/contracts';
import type { InteractionDTO } from '@iara/contracts';

// V1 — Engajamento. Lista interações e auto-respostas; permite simular um comentário/DM
// (no real, vem por webhook das redes). spam/parceria são roteados; o resto é respondido.
const KIND_LABEL: Record<string, string> = {
  duvida: 'dúvida',
  elogio: 'elogio',
  e_ia: 'é IA?',
  spam: 'spam',
  parceria: 'parceria',
};

export default function EngajamentoPage() {
  const { active: persona } = useActivePersona();
  const [items, setItems] = useState<InteractionDTO[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const inter = await api.listInteractions();
      setItems(persona ? inter.filter((i) => i.personaId === persona.id) : inter);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.id]);

  async function send() {
    if (!persona || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.receiveInteraction({
        personaId: persona.id,
        platform: SocialPlatform.INSTAGRAM,
        externalId: `sim-${Date.now()}`,
        text: text.trim(),
      });
      setText('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Engajamento"
        subtitle="A Isabella responde comentários/DMs no tom dela. Parcerias e spam vão para revisão."
      />
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-6 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Simular um comentário/DM recebido…"
          className="flex-1 rounded-md border border-nude px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={busy || !persona}
          className="rounded-md bg-terracota px-4 py-2 text-sm text-paper disabled:opacity-60"
        >
          {busy ? 'Processando…' : 'Receber'}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink/40">Nenhuma interação ainda. Simule uma acima.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-md border border-nude bg-white p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-nude-light/70 px-2 py-0.5 text-[10px] uppercase text-ink/60">
                  {KIND_LABEL[i.kind] ?? i.kind}
                </span>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px]',
                    i.status === 'ANSWERED'
                      ? 'bg-oliva/15 text-oliva-dark'
                      : 'bg-nude-light/70 text-ink/50',
                  ].join(' ')}
                >
                  {i.status === 'ANSWERED' ? 'respondido' : 'roteado p/ humano'}
                </span>
                <span className="ml-auto text-[10px] text-ink/40">{i.platform}</span>
              </div>
              <p className="text-sm text-ink/80">“{i.inboundText}”</p>
              {i.replyDraft && (
                <p className="mt-1 border-l-2 border-terracota pl-2 text-sm text-ink/60">
                  ↳ {i.replyDraft}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

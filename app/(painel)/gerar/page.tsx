'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import type { ContentItemDTO } from '@iara/contracts';

// Tela 3 — Gerar Conteúdo (B1). Dispara lote (imagem+legenda) via POST /content/generate.
export default function GerarPage() {
  const { active: persona } = useActivePersona();
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'POST' | 'REEL'>('POST');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ContentItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function gerar() {
    if (!persona) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.generate({ personaId: persona.id, count, type });
      setResult(res.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Gerar Conteúdo"
        subtitle="Dispare o lote da semana. Os itens são enfileirados, passam pelos gates e sobem de coluna na Fila de Aprovação."
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-md border border-nude bg-white p-6 max-w-xl">
        <p className="text-sm mb-3">
          Persona:{' '}
          <strong>{persona ? persona.name : '— (rode o seed)'}</strong>
        </p>
        <label className="block text-sm font-medium mb-2">Formato</label>
        <div className="mb-4 inline-flex rounded-md border border-nude overflow-hidden">
          {(['POST', 'REEL'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={[
                'px-4 py-2 text-sm',
                type === t ? 'bg-terracota text-paper' : 'bg-white text-ink/70 hover:bg-nude/40',
              ].join(' ')}
            >
              {t === 'POST' ? '📷 Post' : '🎬 Reel (vídeo+voz)'}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-2">Quantidade (1–7)</label>
        <input
          type="number"
          min={1}
          max={7}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(7, Number(e.target.value))))}
          className="w-24 rounded-md border border-nude px-3 py-2"
        />
        <button
          onClick={gerar}
          disabled={generating || !persona}
          className="mt-4 block rounded-md bg-terracota px-5 py-2.5 text-paper font-medium hover:bg-terracota-dark disabled:opacity-60"
        >
          {generating ? 'Gerando…' : `Gerar ${count} ${count > 1 ? 'itens' : 'item'}`}
        </button>
        <p className="mt-3 text-xs text-ink/40">
          Cada item entra na fila de jobs: imagem (mock|Flux) → gate de consistência → legenda no
          tom (mock|Claude) → gate de segurança/compliance. Eles nascem em <strong>Gerado</strong> e
          sobem para <strong>Em revisão</strong> conforme o worker processa.
        </p>
      </div>

      {result && (
        <div className="mt-6 max-w-xl">
          <p className="text-sm text-oliva-dark mb-2">
            ✓ {result.length} {result.length > 1 ? 'itens enfileirados' : 'item enfileirado'} —
            acompanhe na{' '}
            <a href="/fila" className="underline">
              Fila de Aprovação
            </a>{' '}
            (os cards sobem de coluna conforme o worker processa).
          </p>
          <ul className="space-y-2">
            {result.map((it) => (
              <li key={it.id} className="rounded-md border border-nude bg-white p-3 text-xs flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.assets[0] && (
                  <img
                    src={it.assets[0].url}
                    alt=""
                    className="h-14 w-14 rounded object-cover shrink-0"
                  />
                )}
                <div>
                  <p>
                    <strong>{it.pilar}</strong> · status:{' '}
                    <span className="font-mono">{it.status}</span>
                    {it.qaFlags?.consistencyScore != null && (
                      <> · consistência {(it.qaFlags.consistencyScore * 100).toFixed(0)}%</>
                    )}
                  </p>
                  <p className="text-ink/60 line-clamp-2 mt-1">{it.caption}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

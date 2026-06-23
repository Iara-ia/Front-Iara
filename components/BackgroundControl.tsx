'use client';

// Controle do plano de fundo no topo — o cliente ajusta intensidade e cor da marca d'água.
import { useState } from 'react';
import { useBackground, type BgLevel, type BgTint } from './BackgroundProvider';

const LEVELS: [BgLevel, string][] = [
  [0, 'Nenhum'],
  [1, 'Sutil'],
  [2, 'Médio'],
];
const TINTS: [BgTint, string, string][] = [
  ['terracota', 'Terracota', '#C2683E'],
  ['oliva', 'Oliva', '#7A7E52'],
  ['neutro', 'Neutro', '#2B2420'],
];

export function BackgroundControl() {
  const { level, tint, setLevel, setTint } = useBackground();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-nude px-2.5 py-1.5 text-sm text-ink/70 hover:bg-nude-light"
        title="Plano de fundo"
        aria-label="Plano de fundo"
      >
        ✦ Fundo
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-nude bg-white p-3 shadow-lg">
            <p className="mb-1 text-xs font-medium text-ink/60">Marca d’água</p>
            <div className="mb-3 flex gap-1">
              {LEVELS.map(([l, nm]) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={[
                    'flex-1 rounded px-2 py-1 text-xs',
                    level === l ? 'bg-terracota text-paper' : 'bg-nude-light text-ink/70',
                  ].join(' ')}
                >
                  {nm}
                </button>
              ))}
            </div>
            <p className="mb-1 text-xs font-medium text-ink/60">Cor</p>
            <div className="flex gap-2">
              {TINTS.map(([t, nm, hex]) => (
                <button
                  key={t}
                  onClick={() => setTint(t)}
                  title={nm}
                  aria-label={nm}
                  className={[
                    'h-7 w-7 rounded-full border-2',
                    tint === t ? 'border-ink' : 'border-transparent',
                  ].join(' ')}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

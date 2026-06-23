'use client';

// Plano de fundo GLOBAL (todas as telas): marca d'água com tema de redes sociais
// (curtidas, @, #, estrela, play, balão), bem clarinha. Fixo atrás de todo o conteúdo.
import { useBackground, type BgTint } from './BackgroundProvider';

const TINTS: Record<BgTint, string> = {
  terracota: '#C2683E',
  oliva: '#7A7E52',
  neutro: '#2B2420',
};

function tileUrl(hex: string, alpha: number): string {
  const g = (x: number, y: number, s: number, r: number, t: string) =>
    `<text x='${x}' y='${y}' font-size='${s}' transform='rotate(${r} ${x} ${y})' fill='${hex}' fill-opacity='${alpha}' font-family='Arial, sans-serif'>${t}</text>`;
  const bubble = `<path d='M118 158 h40 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-26 l-10 9 v-9 h-4 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 z' fill='${hex}' fill-opacity='${alpha}'/>`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
    g(26, 64, 30, -15, '♥') + // ♥
    g(150, 46, 28, 12, '@') +
    g(92, 116, 28, -8, '#') +
    g(36, 165, 26, 10, '★') + // ★
    g(168, 150, 26, -10, '▶') + // ▶
    bubble +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function AppBackground() {
  const { level, tint } = useBackground();
  if (level === 0) return null;
  const alpha = level === 1 ? 0.07 : 0.13;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundImage: tileUrl(TINTS[tint], alpha),
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
      }}
    />
  );
}

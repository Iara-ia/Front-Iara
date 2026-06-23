'use client';

// Preferência do plano de fundo (marca d'água) — por GOSTO DO CLIENTE, salvo no navegador.
// level: 0 = nenhum, 1 = sutil, 2 = médio. tint: cor da marca d'água.
import { createContext, useContext, useEffect, useState } from 'react';

export type BgLevel = 0 | 1 | 2;
export type BgTint = 'terracota' | 'oliva' | 'neutro';

interface BgCtx {
  level: BgLevel;
  tint: BgTint;
  setLevel: (l: BgLevel) => void;
  setTint: (t: BgTint) => void;
}

const Ctx = createContext<BgCtx | null>(null);
const LKEY = 'iara.bg.level';
const TKEY = 'iara.bg.tint';

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevelS] = useState<BgLevel>(1);
  const [tint, setTintS] = useState<BgTint>('terracota');

  useEffect(() => {
    const l = localStorage.getItem(LKEY);
    if (l !== null) setLevelS(Number(l) as BgLevel);
    const t = localStorage.getItem(TKEY) as BgTint | null;
    if (t) setTintS(t);
  }, []);

  const setLevel = (l: BgLevel) => {
    setLevelS(l);
    localStorage.setItem(LKEY, String(l));
  };
  const setTint = (t: BgTint) => {
    setTintS(t);
    localStorage.setItem(TKEY, t);
  };

  return <Ctx.Provider value={{ level, tint, setLevel, setTint }}>{children}</Ctx.Provider>;
}

export function useBackground() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useBackground deve ser usado dentro do BackgroundProvider');
  return c;
}

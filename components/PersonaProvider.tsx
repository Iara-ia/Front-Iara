'use client';

// Contexto da PERSONA ATIVA — a "conta" que está sendo gerenciada no painel.
// Persistido em localStorage; o switcher no topo troca, e todas as telas leem daqui.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PersonaDTO } from '@iara/contracts';

const KEY = 'iara.activePersonaId';

interface PersonaCtx {
  personas: PersonaDTO[];
  active: PersonaDTO | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  loading: boolean;
  reload: () => Promise<void>;
}

const Ctx = createContext<PersonaCtx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [personas, setPersonas] = useState<PersonaDTO[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const list = await api.listPersonas();
    setPersonas(list);
    setLoading(false);
    setActiveIdState((cur) => {
      if (cur && list.some((p) => p.id === cur)) return cur;
      const stored = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
      if (stored && list.some((p) => p.id === stored)) return stored;
      return list[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(KEY, id);
  }, []);

  const active = personas.find((p) => p.id === activeId) ?? null;

  return (
    <Ctx.Provider value={{ personas, active, activeId, setActiveId, loading, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActivePersona() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useActivePersona deve ser usado dentro do PersonaProvider');
  return c;
}

'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import type { PersonaDTO, SocialAccountDTO, MeResponse } from '@iara/contracts';

// Tela 1 — Visão Geral (A2/D1). Status real + conexão de contas sociais.
export default function VisaoGeralPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [persona, setPersona] = useState<PersonaDTO | null>(null);
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>([]);
  const [overview, setOverview] = useState<{ naFila: number; agendados: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [meRes, personas, accs, ov] = await Promise.all([
        api.me(),
        api.listPersonas(),
        api.listSocial(),
        api.analyticsOverview(),
      ]);
      setMe(meRes);
      setPersona(personas[0] ?? null);
      setAccounts(accs);
      setOverview(ov);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function connect(platform: 'INSTAGRAM' | 'TIKTOK') {
    if (!persona) return;
    const handle = window.prompt(`Handle no ${platform} (ex.: @isabellasouz.a)`, '@isabellasouz.a');
    if (!handle) return;
    try {
      await api.connectSocial({ personaId: persona.id, platform, handle });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const connected = (p: string) => accounts.find((a) => a.platform === p);

  const cards = [
    { label: 'Na fila', value: overview ? String(overview.naFila) : '—', hint: 'aguardando aprovação' },
    { label: 'Agendados', value: overview ? String(overview.agendados) : '—', hint: 'próximas publicações' },
    {
      label: 'Contas conectadas',
      value: `${accounts.filter((a) => a.status === 'CONNECTED').length}/2`,
      hint: 'IG · TikTok',
    },
    { label: 'Papel', value: me?.role ?? '—', hint: me?.orgName ?? '' },
  ];

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle={persona ? `Operando: ${persona.name}` : 'Status da operação.'}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border border-nude bg-white p-4">
            <p className="text-xs text-ink/50">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
            <p className="text-[11px] text-ink/40 mt-1">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-nude bg-white p-6 max-w-2xl">
        <h2 className="text-sm font-semibold mb-3">Contas sociais (D1)</h2>
        <div className="space-y-2">
          {(['INSTAGRAM', 'TIKTOK'] as const).map((p) => {
            const acc = connected(p);
            return (
              <div
                key={p}
                className="flex items-center justify-between rounded-md border border-nude-light px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium">{p === 'INSTAGRAM' ? 'Instagram' : 'TikTok'}</span>
                  {acc && <span className="text-ink/50 ml-2">{acc.handle}</span>}
                </div>
                {acc ? (
                  <span className="text-xs rounded bg-oliva/15 text-oliva-dark px-2 py-1">
                    {acc.status === 'CONNECTED' ? '✓ conectada' : acc.status}
                  </span>
                ) : (
                  <button
                    onClick={() => connect(p)}
                    disabled={!persona}
                    className="text-xs rounded bg-terracota px-3 py-1 text-paper hover:bg-terracota-dark disabled:opacity-60"
                  >
                    Conectar
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink/40">
          MVP: conexão simulada (mock). O fluxo real via Ayrshare entra quando a chave existir —
          mesma interface.
        </p>
      </div>
    </>
  );
}

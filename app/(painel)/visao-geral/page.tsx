'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import { ConnectAccountModal } from '@/components/ConnectAccountModal';
import { PlatformIcon } from '@/components/PlatformIcon';
import { PLATFORMS } from '@/lib/platforms';
import type { SocialAccountDTO, MeResponse, SocialPlatform } from '@iara/contracts';

// Tela 1 — Visão Geral. Tudo no contexto da PERSONA ATIVA (conta selecionada no topo).
export default function VisaoGeralPage() {
  const { active: persona } = useActivePersona();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [accounts, setAccounts] = useState<SocialAccountDTO[]>([]);
  const [overview, setOverview] = useState<{ naFila: number; agendados: number } | null>(null);
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!persona) return;
    setError(null);
    try {
      const [meRes, accs, ov] = await Promise.all([
        api.me(),
        api.listSocial(),
        api.analyticsOverview(persona.id),
      ]);
      setMe(meRes);
      setAccounts(accs.filter((a) => a.personaId === persona.id)); // só as redes desta conta
      setOverview(ov);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [persona]);

  useEffect(() => {
    load();
  }, [load]);

  async function disconnect(acc: SocialAccountDTO) {
    if (!window.confirm(`Desconectar ${acc.handle}? O token é revogado; nada é publicado por ela até reconectar.`))
      return;
    try {
      await api.disconnectSocial(acc.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const connected = (p: string) => accounts.find((a) => a.platform === p);
  const nConnected = accounts.filter((a) => a.status === 'CONNECTED').length;

  const cards = [
    { label: 'Na fila', value: overview ? String(overview.naFila) : '—', hint: 'aguardando aprovação' },
    { label: 'Agendados', value: overview ? String(overview.agendados) : '—', hint: 'próximas publicações' },
    { label: 'Redes conectadas', value: `${nConnected}/${PLATFORMS.length}`, hint: persona?.name ?? '' },
    { label: 'Papel', value: me?.role ?? '—', hint: me?.orgName ?? '' },
  ];

  if (!persona) {
    return (
      <>
        <PageHeader title="Visão Geral" subtitle="Selecione uma conta no topo." />
        <p className="text-sm text-ink/50">Nenhuma persona ativa. Crie uma em Minhas Contas.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Visão Geral" subtitle={`Operando: ${persona.name}`} />

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

      <div className="mt-6 rounded-md border border-nude bg-white/85 p-6 max-w-2xl">
        <div>
        <h2 className="text-sm font-semibold mb-1">Redes de {persona.name}</h2>
        <div className="mb-3 rounded-md border border-oliva/30 bg-oliva/10 px-3 py-2 text-[12px] text-ink/70">
          🔒 <strong>A IARA nunca pede nem armazena senhas.</strong> A conexão é pelo login oficial
          de cada rede (OAuth); guardamos só um token de acesso revogável.
        </div>
        <div className="space-y-2">
          {PLATFORMS.map((pl) => {
            const acc = connected(pl.key);
            return (
              <div
                key={pl.key}
                className="flex items-center justify-between rounded-md border border-nude-light bg-white/80 px-3 py-2"
              >
                <div className="text-sm flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-nude-light/60">
                    <PlatformIcon platform={pl.key} size={18} />
                  </span>
                  <span className="font-medium">{pl.label}</span>
                  {!pl.realReady && (
                    <span className="text-[10px] rounded bg-nude-light px-1.5 py-0.5 text-ink/40">
                      mock
                    </span>
                  )}
                  {acc && <span className="text-ink/50 ml-1">{acc.handle}</span>}
                </div>
                {acc ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs rounded bg-oliva/15 text-oliva-dark px-2 py-1"
                      title="Conectada via login oficial — token guardado criptografado"
                    >
                      🔑 {acc.status === 'CONNECTED' ? 'conectada' : acc.status}
                    </span>
                    <button
                      onClick={() => disconnect(acc)}
                      className="text-xs text-ink/40 hover:text-red-600"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConnecting(pl.key)}
                    className="text-xs rounded bg-terracota px-3 py-1 text-paper hover:bg-terracota-dark"
                  >
                    Conectar
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink/40">
          Conexão simulada (mock) no dev. O fluxo real via Ayrshare entra quando a chave existir —
          mesma interface, sem mudar nada aqui.
        </p>
        </div>
      </div>

      {connecting && (
        <ConnectAccountModal
          personaId={persona.id}
          personaName={persona.name}
          platform={connecting}
          onClose={() => setConnecting(null)}
          onConnected={() => {
            setConnecting(null);
            load();
          }}
        />
      )}
    </>
  );
}

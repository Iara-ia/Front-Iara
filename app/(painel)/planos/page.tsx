'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import type { BillingDTO, PlanDef } from '@iara/contracts';

// Planos SaaS (receita da plataforma). Mostra o catálogo + plano atual; assinar muda o tier.
// mock = ativa na hora; stripe = redireciona para o Checkout.
function cota(n: number) {
  return n === -1 ? 'ilimitado' : String(n);
}

export default function PlanosPage() {
  const [data, setData] = useState<BillingDTO | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await api.getBilling());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function assinar(p: PlanDef) {
    setBusy(p.tier);
    setError(null);
    try {
      const res = await api.checkout({ plan: p.tier as 'FREE' | 'STARTER' | 'PRO' | 'SCALE' });
      if (res.url) {
        window.location.href = res.url; // Stripe Checkout
        return;
      }
      await load(); // mock: ativado na hora
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Planos"
        subtitle="Escolha o plano da plataforma. O cobrador é configurável (mock no dev, Stripe em produção)."
      />
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {data && (
        <p className="mb-4 text-sm text-ink/60">
          Plano atual: <strong className="text-terracota">{data.current.label}</strong> · cobrança:{' '}
          <span className="font-mono">{data.provider}</span>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.catalog.map((p) => {
          const atual = p.tier === data.plan;
          return (
            <div
              key={p.tier}
              className={[
                'rounded-lg border p-5 flex flex-col',
                atual ? 'border-terracota ring-1 ring-terracota' : 'border-nude',
              ].join(' ')}
            >
              <h3 className="text-lg font-semibold text-ink">{p.label}</h3>
              <p className="mt-1 text-2xl font-bold text-terracota">
                R$ {p.priceBRLMonthly}
                <span className="text-sm font-normal text-ink/40">/mês</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink/70 flex-1">
                {p.highlights.map((h) => (
                  <li key={h}>✓ {h}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-ink/40">
                {p.limits.personas} persona(s) · {cota(p.limits.postsPerMonth)} posts/mês
              </p>
              <button
                onClick={() => assinar(p)}
                disabled={atual || busy !== null}
                className={[
                  'mt-4 rounded-md px-4 py-2 text-sm font-medium',
                  atual
                    ? 'bg-nude-light/70 text-ink/40 cursor-default'
                    : 'bg-terracota text-paper hover:bg-terracota-dark disabled:opacity-60',
                ].join(' ')}
              >
                {atual ? 'Plano atual' : busy === p.tier ? 'Processando…' : 'Assinar'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

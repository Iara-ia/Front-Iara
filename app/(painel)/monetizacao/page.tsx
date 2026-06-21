'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import type { ContentItemDTO, AffiliateLink } from '@iara/contracts';

// Sprint 3 — Monetização / Gestor de afiliados. Adiciona links (UTM/cupom) aos itens;
// ter afiliado injeta #publi (Conar) automaticamente no back.
export default function MonetizacaoPage() {
  const [items, setItems] = useState<ContentItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [rev, aprov] = await Promise.all([
        api.listContent('EM_REVISAO'),
        api.listContent('APROVADO'),
      ]);
      setItems([...rev, ...aprov]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader
        title="Monetização"
        subtitle="Adicione links de afiliado/parceria. Ter afiliado injeta #publi automaticamente."
      />
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <div className="h-40 animate-pulse rounded-md border border-nude bg-nude-light/40" />
      ) : items.length === 0 ? (
        <p className="text-xs text-ink/40">Nenhum item em revisão/aprovado para monetizar.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <AffiliateCard key={it.id} item={it} onSaved={load} />
          ))}
        </div>
      )}
    </>
  );
}

function AffiliateCard({ item, onSaved }: { item: ContentItemDTO; onSaved: () => void }) {
  const [links, setLinks] = useState<AffiliateLink[]>(item.affiliateLinks ?? []);
  const [url, setUrl] = useState('');
  const [network, setNetwork] = useState('amazon');
  const [utm, setUtm] = useState('');
  const [cupom, setCupom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!url.trim()) {
      setErr('Informe a URL.');
      return;
    }
    setBusy(true);
    setErr(null);
    const novo: AffiliateLink = {
      url: url.trim(),
      network,
      ...(utm.trim() ? { utm: utm.trim() } : {}),
      ...(cupom.trim() ? { cupom: cupom.trim() } : {}),
    };
    const next = [...links, novo];
    try {
      const updated = await api.setAffiliateLinks(item.id, { links: next });
      setLinks(updated.affiliateLinks ?? next);
      setUrl('');
      setUtm('');
      setCupom('');
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-nude bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{item.pilar ?? 'conteúdo'}</p>
        <span className="text-[10px] uppercase text-ink/40">{item.status}</span>
      </div>
      <p className="line-clamp-2 text-xs text-ink/60">{item.caption ?? '—'}</p>

      {links.length > 0 && (
        <ul className="space-y-1">
          {links.map((l, i) => (
            <li key={i} className="rounded bg-nude-light/50 px-2 py-1 text-[11px] text-ink/70">
              <span className="font-medium">{l.network}</span> · {l.url}
              {l.cupom ? ` · cupom ${l.cupom}` : ''}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL do link"
          className="col-span-2 rounded-md border border-nude px-2 py-1.5 text-xs"
        />
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="rounded-md border border-nude px-2 py-1.5 text-xs"
        >
          <option value="amazon">Amazon</option>
          <option value="hotmart">Hotmart</option>
          <option value="magalu">Magalu</option>
          <option value="shopee">Shopee</option>
          <option value="outro">Outro</option>
        </select>
        <input
          value={cupom}
          onChange={(e) => setCupom(e.target.value)}
          placeholder="Cupom (opcional)"
          className="rounded-md border border-nude px-2 py-1.5 text-xs"
        />
        <input
          value={utm}
          onChange={(e) => setUtm(e.target.value)}
          placeholder="UTM (opcional)"
          className="col-span-2 rounded-md border border-nude px-2 py-1.5 text-xs"
        />
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}
      <button
        onClick={add}
        disabled={busy}
        className="rounded-md bg-terracota px-3 py-1.5 text-xs text-paper disabled:opacity-60"
      >
        {busy ? 'Salvando…' : 'Adicionar link'}
      </button>
    </div>
  );
}

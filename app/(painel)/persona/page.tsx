'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import type { PersonaDTO } from '@iara/contracts';

// Tela 2 — Configurar Persona (A3). Salva via PUT /personas/:id; refs via POST /personas/:id/refs.
export default function PersonaPage() {
  const [persona, setPersona] = useState<PersonaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // campos editáveis
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [niches, setNiches] = useState('');
  const [tom, setTom] = useState('');
  const [refUrl, setRefUrl] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listPersonas();
      const p = list[0] ?? null;
      setPersona(p);
      if (p) {
        setName(p.name);
        setBio(p.bio ?? '');
        setNiches(p.niches.join(', '));
        setTom(p.personality?.tom ?? '');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!persona) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const updated = await api.updatePersona(persona.id, {
        name,
        bio,
        niches: niches.split(',').map((s) => s.trim()).filter(Boolean),
        personality: {
          ...persona.personality,
          tom,
        },
        aiDisclosure: true,
      });
      setPersona(updated);
      setMsg('Persona salva com sucesso.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addRef() {
    if (!persona || !refUrl.trim()) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const updated = await api.uploadRefs(persona.id, [refUrl.trim()]);
      setPersona(updated);
      setRefUrl('');
      setMsg('Referência adicionada.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton />;
  if (!persona)
    return (
      <>
        <PageHeader title="Configurar Persona" />
        <p className="text-sm text-red-700">
          Nenhuma persona encontrada. Rode o seed: <code>npm run -w packages/db seed</code>.
        </p>
      </>
    );

  const paleta = persona.visualProfile?.paleta ?? [];
  const refs = persona.visualProfile?.faceRefs ?? [];

  return (
    <>
      <PageHeader
        title="Configurar Persona"
        subtitle="Configure a Isabella uma vez. Aplica-se a toda geração."
      />

      {error && <Banner kind="error">{error}</Banner>}
      {msg && <Banner kind="ok">{msg}</Banner>}

      <div className="rounded-md border border-nude bg-white p-6 max-w-2xl space-y-4">
        <Input label="Nome" value={name} onChange={setName} />
        <Textarea label="Bio" value={bio} onChange={setBio} />
        <Input label="Nichos (separados por vírgula)" value={niches} onChange={setNiches} />
        <Input label="Tom" value={tom} onChange={setTom} />

        <div>
          <p className="text-xs text-ink/50 mb-1">Paleta</p>
          <div className="flex gap-2">
            {paleta.map((c) => (
              <span key={c} className="h-6 w-10 rounded" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked readOnly />
          Selo &quot;conteúdo gerado por IA&quot; (obrigatório · não pode ser desligado)
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-terracota px-5 py-2.5 text-paper font-medium hover:bg-terracota-dark disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Salvar persona'}
        </button>
      </div>

      <div className="rounded-md border border-nude bg-white p-6 max-w-2xl space-y-3 mt-6">
        <h2 className="text-sm font-semibold">Refs faciais (face-lock)</h2>
        <p className="text-xs text-ink/50">
          Cole a URL de uma imagem de referência. No MVP aceitamos URLs; no produção é upload ao
          S3/R2.
        </p>
        <div className="flex gap-2">
          <input
            value={refUrl}
            onChange={(e) => setRefUrl(e.target.value)}
            placeholder="https://…/isabella-ref.png"
            className="flex-1 rounded-md border border-nude px-3 py-2 text-sm"
          />
          <button
            onClick={addRef}
            disabled={saving || !refUrl.trim()}
            className="rounded-md bg-oliva px-4 py-2 text-paper text-sm disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
        {refs.length === 0 ? (
          <p className="text-xs text-ink/40">Nenhuma ref ainda. Sem refs, o gate usa score neutro.</p>
        ) : (
          <ul className="grid grid-cols-4 gap-2">
            {refs.map((r, i) => (
              <li key={i} className="text-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.url}
                  alt={`ref ${i + 1}`}
                  className="h-20 w-full rounded object-cover border border-nude"
                />
                <span className={r.approved ? 'text-oliva-dark' : 'text-ink/40'}>
                  {r.approved ? '✓ aprovada' : 'pendente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-nude px-3 py-2 text-sm"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-nude px-3 py-2 text-sm"
      />
    </div>
  );
}

function Banner({ kind, children }: { kind: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <div
      className={[
        'mb-4 rounded-md px-4 py-2 text-sm',
        kind === 'ok' ? 'bg-oliva/15 text-oliva-dark' : 'bg-red-50 text-red-700',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <>
      <PageHeader title="Configurar Persona" subtitle="Carregando…" />
      <div className="h-64 rounded-md border border-nude bg-nude-light/40 animate-pulse max-w-2xl" />
    </>
  );
}

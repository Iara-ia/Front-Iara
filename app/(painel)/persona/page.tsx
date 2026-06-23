'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { useActivePersona } from '@/components/PersonaProvider';
import type { PersonaDTO, NicheCatalog } from '@iara/contracts';

// Tela 2 — Configurar Persona (A3). Salva via PUT /personas/:id; refs via POST /personas/:id/refs.
export default function PersonaPage() {
  const { activeId, setActiveId, reload: reloadSwitcher } = useActivePersona();
  const [persona, setPersona] = useState<PersonaDTO | null>(null);
  const [personas, setPersonas] = useState<PersonaDTO[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // campos editáveis
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<NicheCatalog | null>(null);
  const [customNiche, setCustomNiche] = useState('');
  const [tom, setTom] = useState('');
  const [loraId, setLoraId] = useState('');
  const [refUrl, setRefUrl] = useState('');

  async function load(selectId?: string) {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listPersonas();
      setPersonas(list);
      const p =
        (selectId ? list.find((x) => x.id === selectId) : null) ??
        list.find((x) => x.id === activeId) ??
        list[0] ??
        null;
      setPersona(p);
      if (p) {
        setName(p.name);
        setBio(p.bio ?? '');
        setSelectedNiches(p.niches);
        setTom(p.personality?.tom ?? '');
        setLoraId(p.visualProfile?.loraId ?? '');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.listNiches().then(setCatalog).catch(() => {});
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
        niches: selectedNiches,
        personality: {
          ...persona.personality,
          tom,
        },
        // mescla com o visualProfile atual (preserva faceRefs + paleta); grava o LoRA.
        visualProfile: {
          ...persona.visualProfile,
          loraId: loraId.trim() || null,
        },
        aiDisclosure: true,
      });
      setPersona(updated);
      await reloadSwitcher(); // reflete nome/nichos no switcher e em Minhas Contas
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

  async function criarPersona() {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const nova = await api.createPersona({ name: newName.trim() });
      setNewName('');
      setMsg('Persona criada.');
      setActiveId(nova.id); // já entra como conta ativa
      await reloadSwitcher();
      await load(nova.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function toggleNiche(slug: string) {
    setSelectedNiches((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    );
  }
  function slugifyNiche(s: string) {
    return s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  function addCustomNiche() {
    const slug = slugifyNiche(customNiche);
    if (!slug) return;
    setSelectedNiches((cur) => (cur.includes(slug) ? cur : [...cur, slug]));
    setCustomNiche('');
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

      <div className="mb-4 flex flex-wrap items-center gap-2 max-w-2xl">
        <label className="text-xs text-ink/50">Persona:</label>
        <select
          value={persona.id}
          onChange={(e) => {
            setActiveId(e.target.value);
            load(e.target.value);
          }}
          className="rounded-md border border-nude px-3 py-2 text-sm"
        >
          {personas.map((pp) => (
            <option key={pp.id} value={pp.id}>
              {pp.name}
            </option>
          ))}
        </select>
        <span className="mx-1 text-ink/30">|</span>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova persona"
          className="rounded-md border border-nude px-3 py-2 text-sm"
        />
        <button
          onClick={criarPersona}
          disabled={saving || !newName.trim()}
          className="rounded-md border border-nude px-3 py-2 text-sm hover:bg-nude/40 disabled:opacity-60"
        >
          + Nova persona
        </button>
      </div>

      <div className="rounded-md border border-nude bg-white p-6 max-w-2xl space-y-4">
        <Input label="Nome" value={name} onChange={setName} />
        <Textarea label="Bio" value={bio} onChange={setBio} />
        <NicheLeque
          catalog={catalog}
          selected={selectedNiches}
          onToggle={toggleNiche}
          custom={customNiche}
          onCustom={setCustomNiche}
          onAddCustom={addCustomNiche}
        />
        <Input label="Tom" value={tom} onChange={setTom} />

        <div>
          <p className="text-xs text-ink/50 mb-1">Paleta</p>
          <div className="flex gap-2">
            {paleta.map((c) => (
              <span key={c} className="h-6 w-10 rounded" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-ink/50 mb-1">Modelo facial — LoRA (face-lock)</p>
          <input
            value={loraId}
            onChange={(e) => setLoraId(e.target.value)}
            placeholder="ex.: flux-lora-isabella-v1  (ou URL dos pesos)"
            className="w-full rounded-md border border-nude px-3 py-2 text-sm font-mono"
          />
          <div className="mt-1.5 flex items-center gap-2">
            {loraId.trim() ? (
              <span className="rounded bg-oliva/15 px-2 py-0.5 text-[11px] text-oliva-dark">
                ✓ rosto travado — geração usará o LoRA da Isabella
              </span>
            ) : (
              <span className="rounded bg-golden/20 px-2 py-0.5 text-[11px] text-terracota-dark">
                sem LoRA — gerador padrão (placeholder no dev)
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-ink/40">
            Cole o ID/URL do LoRA treinado nas {refs.length} refs aprovadas. Vazio = sem rosto
            travado. Ative o Flux real com <code>PROVIDER_IMAGE=flux</code> + chave. Passo a passo
            em <code>docs/COMO_TREINAR_LORA.md</code>.
          </p>
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

function NicheLeque({
  catalog,
  selected,
  onToggle,
  custom,
  onCustom,
  onAddCustom,
}: {
  catalog: NicheCatalog | null;
  selected: string[];
  onToggle: (slug: string) => void;
  custom: string;
  onCustom: (v: string) => void;
  onAddCustom: () => void;
}) {
  const customSelected = catalog
    ? selected.filter((s) => !catalog.all.some((n) => n.slug === s))
    : [];
  return (
    <div>
      <p className="text-xs text-ink/50 mb-1">Nichos — o leque da persona</p>
      <p className="text-[11px] text-ink/40 mb-2">
        Escolha os nichos que a Isabella vai abordar. Eles guiam o mix de conteúdo e as hashtags.
        Você também pode adicionar nichos próprios.
      </p>
      {!catalog ? (
        <p className="text-xs text-ink/40">Carregando leque…</p>
      ) : (
        <div className="space-y-3">
          {catalog.groups.map((g) => (
            <div key={g.category}>
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">{g.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.niches.map((n) => {
                  const on = selected.includes(n.slug);
                  return (
                    <button
                      key={n.slug}
                      type="button"
                      onClick={() => onToggle(n.slug)}
                      title={n.angle}
                      className={[
                        'rounded-full px-3 py-1 text-xs border transition',
                        on
                          ? 'bg-terracota text-paper border-terracota'
                          : 'bg-white text-ink border-nude hover:bg-nude/40',
                      ].join(' ')}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {customSelected.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Personalizados</p>
              <div className="flex flex-wrap gap-1.5">
                {customSelected.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onToggle(s)}
                    className="rounded-full px-3 py-1 text-xs bg-oliva text-paper border border-oliva"
                  >
                    {s} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <input
              value={custom}
              onChange={(e) => onCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddCustom();
                }
              }}
              placeholder="Adicionar nicho próprio…"
              className="flex-1 rounded-md border border-nude px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={onAddCustom}
              className="rounded-md border border-nude px-4 py-2 text-sm hover:bg-nude/40"
            >
              Adicionar
            </button>
          </div>
          <p className="text-[11px] text-ink/40">{selected.length} nicho(s) selecionado(s)</p>
        </div>
      )}
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

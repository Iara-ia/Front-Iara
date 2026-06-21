'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { PageHeader } from '@/components/PageHeader';
import { KANBAN_COLUMNS, ContentStatus } from '@iara/contracts';
import type { ContentItemDTO } from '@iara/contracts';
import { api } from '@/lib/api';

const LABELS: Record<string, string> = {
  GERADO: 'Gerado',
  EM_REVISAO: 'Em revisão',
  APROVADO: 'Aprovado',
};

// Limiar de consistência: mesmo valor que o back usa para liberar a aprovação.
const CONSISTENCY_THRESHOLD = 0.8;

// Transições válidas no kanban (espelha o que o back aceita; evita disparar patch que volta 409).
// Avançar: GERADO → EM_REVISAO → APROVADO. Voltar: APROVADO → EM_REVISAO → GERADO.
const VALID_TRANSITIONS: Record<string, string[]> = {
  GERADO: ['EM_REVISAO'],
  EM_REVISAO: ['GERADO', 'APROVADO'],
  APROVADO: ['EM_REVISAO'],
};

type GateResult = { ok: true } | { ok: false; reason: string };

// Antecipa os gates do back (422/409/403): por que NÃO é possível mover `item` para `target`.
function evaluateDrop(item: ContentItemDTO, target: string): GateResult {
  if (item.status === target) return { ok: true };

  const allowed = VALID_TRANSITIONS[item.status] ?? [];
  if (!allowed.includes(target)) {
    return { ok: false, reason: 'Transição não permitida.' };
  }

  if (target === ContentStatus.APROVADO) {
    const safety = item.qaFlags?.safety;
    if (safety === 'block') {
      return { ok: false, reason: 'Bloqueado por compliance.' };
    }
    if (safety === 'flag') {
      return { ok: false, reason: 'Marcado para revisão — edite antes.' };
    }
    const score = item.qaFlags?.consistencyScore;
    if (score != null && score < CONSISTENCY_THRESHOLD) {
      return { ok: false, reason: 'Consistência abaixo do limiar.' };
    }
  }

  return { ok: true };
}

// Tela 4 — Fila de Aprovação (kanban com drag-and-drop). O ponto do HITL (<2h/semana). Dados REAIS.
export default function FilaPage() {
  const [items, setItems] = useState<ContentItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // activationConstraint evita conflito com cliques nos botões/textarea do card.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setItems(await api.listContent());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Polling leve: enquanto houver itens em GERADO (worker ainda processando), refaz o fetch
  // a cada 3s para o operador ver os itens "subindo" de coluna. Para sozinho quando esvazia.
  const hasPending = items.some((i) => i.status === ContentStatus.GERADO);
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(() => load({ silent: true }), 3000);
    return () => clearInterval(t);
  }, [hasPending]);

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  // Move com refresh otimista: atualiza local na hora; se a API falhar, REVERTE e mostra erro.
  async function move(item: ContentItemDTO, status: string) {
    const gate = evaluateDrop(item, status);
    if (!gate.ok) {
      setNotice(null);
      setError(gate.reason);
      return;
    }
    clearMessages();
    const prev = items;
    setItems((cur) =>
      cur.map((i) =>
        i.id === item.id ? { ...i, status: status as ContentItemDTO['status'] } : i,
      ),
    );
    try {
      const updated = await api.patchContent(item.id, {
        status: status as ContentItemDTO['status'],
      });
      // Reconcilia com o que o back gravou (approvedBy/approvedAt, etc.).
      setItems((cur) => cur.map((i) => (i.id === updated.id ? updated : i)));
    } catch (e) {
      setItems(prev); // reverte o otimismo
      setError((e as Error).message);
    }
  }

  async function saveCaption(item: ContentItemDTO, caption: string) {
    clearMessages();
    const prev = items;
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, caption } : i)));
    try {
      // Editar legenda re-roda o gate no back; aceitamos o item devolvido como verdade.
      const updated = await api.patchContent(item.id, { caption });
      setItems((cur) => cur.map((i) => (i.id === updated.id ? updated : i)));
    } catch (e) {
      setItems(prev);
      setError((e as Error).message);
    }
  }

  function onDragStart(e: DragStartEvent) {
    clearMessages();
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const item = items.find((i) => i.id === String(active.id));
    const target = String(over.id);
    if (!item || item.status === target) return;
    move(item, target);
  }

  const byCol = (col: string) => items.filter((i) => i.status === col);
  const exceptions = items.filter((i) => i.status === 'FALHOU' || i.status === 'REPROVADO');
  const activeItem = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  return (
    <>
      <PageHeader
        title="Fila de Aprovação"
        subtitle="Cure os itens gerados pela IA. Arraste entre as colunas — aprovar exige passar nos gates."
      />

      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => load()}
          className="rounded-md border border-nude bg-white px-3 py-1.5 text-sm text-ink/70 hover:bg-nude-light"
        >
          Atualizar
        </button>
        {hasPending && (
          <span className="flex items-center gap-1.5 text-xs text-ink/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-golden" />
            Processando itens gerados…
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {notice && (
        <div className="mb-4 rounded-md bg-oliva/10 px-4 py-2 text-sm text-oliva-dark">{notice}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {KANBAN_COLUMNS.map((c) => (
            <div key={c} className="h-72 rounded-md bg-nude-light/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {KANBAN_COLUMNS.map((col) => (
              <Column
                key={col}
                col={col}
                items={byCol(col)}
                activeItem={activeItem}
                onMove={move}
                onSaveCaption={saveCaption}
              />
            ))}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="rotate-2 opacity-90">
                <Card item={activeItem} onMove={move} onSaveCaption={saveCaption} overlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {exceptions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-2 text-red-700">
            Reprovados / Falharam ({exceptions.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {exceptions.map((item) => (
              <div key={item.id} className="rounded-md border border-red-200 bg-red-50 p-3 text-xs">
                <p className="font-mono text-red-700">{item.status}</p>
                <p className="text-ink/70 mt-1">{item.pilar}</p>
                <p className="text-red-600 mt-1">
                  {(item.qaFlags as { reason?: string } | null)?.reason ?? 'sem motivo'}
                </p>
                <button
                  onClick={() => move(item, 'EM_REVISAO')}
                  className="mt-2 text-[11px] underline text-ink/60"
                >
                  Reenviar para revisão
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-ink/40">
        Mover para <strong>Aprovado</strong> grava quem aprovou e quando, e exige consistência +
        segurança ok.
      </p>
    </>
  );
}

function Column({
  col,
  items,
  activeItem,
  onMove,
  onSaveCaption,
}: {
  col: string;
  items: ContentItemDTO[];
  activeItem: ContentItemDTO | null;
  onMove: (i: ContentItemDTO, s: string) => void;
  onSaveCaption: (i: ContentItemDTO, c: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col });

  // Feedback visual antecipando o gate: se estou arrastando um card que NÃO pode cair aqui,
  // a coluna sinaliza recusa (borda vermelha) em vez de "pronto pra soltar".
  const gate = activeItem ? evaluateDrop(activeItem, col) : null;
  const isDraggingForeign = activeItem != null && activeItem.status !== col;
  const wouldReject = isDraggingForeign && gate != null && !gate.ok;

  const ring = isOver
    ? wouldReject
      ? 'ring-2 ring-red-400 bg-red-50/60'
      : 'ring-2 ring-terracota/50 bg-nude-light'
    : isDraggingForeign && !wouldReject
      ? 'ring-1 ring-terracota/20'
      : '';

  return (
    <div
      ref={setNodeRef}
      className={['rounded-md bg-nude-light p-3 min-h-[300px] transition', ring].join(' ')}
    >
      <h2 className="text-sm font-semibold mb-3 flex justify-between">
        <span>{LABELS[col] ?? col}</span>
        <span className="text-ink/40">{items.length}</span>
      </h2>
      {isOver && wouldReject && gate && !gate.ok && (
        <p className="mb-2 rounded bg-red-100 px-2 py-1 text-[11px] text-red-700">
          {gate.reason}
        </p>
      )}
      <div className="space-y-3">
        {items.length === 0 && <p className="text-xs text-ink/40">Sem itens.</p>}
        {items.map((item) => (
          <DraggableCard
            key={item.id}
            item={item}
            onMove={onMove}
            onSaveCaption={onSaveCaption}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({
  item,
  onMove,
  onSaveCaption,
}: {
  item: ContentItemDTO;
  onMove: (i: ContentItemDTO, s: string) => void;
  onSaveCaption: (i: ContentItemDTO, c: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'opacity-40' : ''}
      // listeners/attributes no wrapper: o PointerSensor com distance=6 deixa o clique
      // nos botões/textarea passar; só vira "drag" depois de arrastar 6px.
      {...attributes}
      {...listeners}
    >
      <Card item={item} onMove={onMove} onSaveCaption={onSaveCaption} />
    </div>
  );
}

function Card({
  item,
  onMove,
  onSaveCaption,
  overlay,
}: {
  item: ContentItemDTO;
  onMove: (i: ContentItemDTO, s: string) => void;
  onSaveCaption: (i: ContentItemDTO, c: string) => void;
  overlay?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(item.caption ?? '');
  const score = item.qaFlags?.consistencyScore;
  const safety = item.qaFlags?.safety;

  // Impede que cliques/foco em controles internos virem início de drag.
  const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div className="rounded-md border border-nude bg-white p-3 text-xs space-y-2 cursor-grab active:cursor-grabbing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {item.assets[0] && (
        <img src={item.assets[0].url} alt="" className="h-28 w-full rounded object-cover" />
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {item.pilar && <Tag>{item.pilar}</Tag>}
        {score != null && (
          <Tag tone={score >= CONSISTENCY_THRESHOLD ? 'ok' : 'warn'}>
            cons. {(score * 100).toFixed(0)}%
          </Tag>
        )}
        {safety && (
          <Tag tone={safety === 'pass' ? 'ok' : 'warn'}>safety: {safety}</Tag>
        )}
      </div>

      {editing && !overlay ? (
        <div className="space-y-1" onPointerDown={stop}>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onPointerDown={stop}
            rows={4}
            className="w-full rounded border border-nude px-2 py-1 text-[11px]"
          />
          <div className="flex gap-2">
            <button
              onPointerDown={stop}
              onClick={() => {
                onSaveCaption(item, caption);
                setEditing(false);
              }}
              className="rounded bg-oliva px-2 py-1 text-paper text-[11px]"
            >
              Salvar
            </button>
            <button
              onPointerDown={stop}
              onClick={() => setEditing(false)}
              className="text-[11px] text-ink/50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-ink/70 line-clamp-3 whitespace-pre-wrap">{item.caption}</p>
      )}

      {!overlay && (
        <div className="flex gap-2 pt-1 border-t border-nude-light">
          {!editing && (
            <button
              onPointerDown={stop}
              onClick={() => setEditing(true)}
              className="text-[11px] underline text-ink/60"
            >
              Editar
            </button>
          )}
          {item.status === 'GERADO' && (
            <button
              onPointerDown={stop}
              onClick={() => onMove(item, 'EM_REVISAO')}
              className="text-[11px] underline text-ink/60"
            >
              → Revisão
            </button>
          )}
          {item.status === 'EM_REVISAO' && (
            <button
              onPointerDown={stop}
              onClick={() => onMove(item, 'APROVADO')}
              className="ml-auto rounded bg-terracota px-3 py-1 text-paper text-[11px] hover:bg-terracota-dark"
            >
              Aprovar ✓
            </button>
          )}
          {item.status === 'APROVADO' && (
            <span
              className="ml-auto text-[11px] text-oliva-dark"
              title={item.approvedAt ? `em ${item.approvedAt}` : ''}
            >
              ✓ aprovado{item.approvedBy ? ` por ${item.approvedBy.slice(0, 6)}…` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'ok' | 'warn' }) {
  return (
    <span
      className={[
        'rounded px-1.5 py-0.5 text-[10px]',
        tone === 'ok'
          ? 'bg-oliva/15 text-oliva-dark'
          : tone === 'warn'
            ? 'bg-golden/20 text-terracota-dark'
            : 'bg-nude-light text-ink/60',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

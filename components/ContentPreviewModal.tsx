'use client';

// Preview grande de um post: imagem (ou capa do Reel) + legenda, hashtags, redes, hora/status.
// É aqui que o operador VÊ exatamente o que a Isabella vai publicar.
import { PlatformIcon } from './PlatformIcon';
import { coverUrl, isReel } from './PostThumb';
import { platformMeta } from '@/lib/platforms';
import type { ContentItemDTO } from '@iara/contracts';

const STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  GERADO: 'Gerado',
  EM_REVISAO: 'Em revisão',
  APROVADO: 'Aprovado',
  AGENDADO: 'Agendado',
  PUBLICADO: 'Publicado',
  REPROVADO: 'Reprovado',
  FALHOU: 'Falhou',
};

export function ContentPreviewModal({
  item,
  onClose,
}: {
  item: ContentItemDTO;
  onClose: () => void;
}) {
  const url = coverUrl(item);
  const reel = isReel(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-lg bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2">
          <div className="relative flex items-center justify-center bg-ink/5 min-h-[280px]">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-ink/40">sem imagem</span>
            )}
            {reel && (
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs text-white">
                ▶ Reel · vídeo + voz
              </span>
            )}
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-nude-light px-2 py-0.5 text-xs font-medium text-ink/70">
                {item.pilar ?? 'conteúdo'}
              </span>
              <span className="text-xs text-ink/50">{STATUS[item.status] ?? item.status}</span>
            </div>

            <p className="whitespace-pre-wrap text-sm text-ink/90">{item.caption ?? '—'}</p>

            {item.hashtags?.length > 0 && (
              <p className="mt-2 text-xs text-terracota">{item.hashtags.join(' ')}</p>
            )}

            {item.cta && <p className="mt-2 text-xs text-ink/60">CTA: {item.cta}</p>}

            <div className="mt-4 space-y-2 text-xs text-ink/70">
              {item.scheduleAt && (
                <p>
                  🕒 {new Date(item.scheduleAt).toLocaleString('pt-BR')}
                </p>
              )}
              {item.platforms?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-ink/50">Redes:</span>
                  {item.platforms.map((p) => (
                    <span key={p} className="flex items-center gap-1">
                      <PlatformIcon platform={p} size={15} /> {platformMeta(p).label}
                    </span>
                  ))}
                </div>
              )}
              {item.affiliateLinks?.length > 0 && (
                <p>🔗 {item.affiliateLinks.length} link(s) de afiliado</p>
              )}
              {reel && !url && (
                <p className="text-ink/40">O vídeo toca quando o provedor real (Runway/ElevenLabs) ligar.</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-auto self-end rounded-md px-4 py-2 text-sm text-ink/60 hover:bg-nude-light"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

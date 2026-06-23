// Miniatura visual de um post: capa (imagem) + selo de Reel quando tem vídeo.
import type { ContentItemDTO } from '@iara/contracts';

export function coverUrl(item: ContentItemDTO): string | null {
  return item.assets?.find((a) => a.kind === 'image')?.url ?? null;
}
export function isReel(item: ContentItemDTO): boolean {
  return item.type === 'REEL' || !!item.assets?.some((a) => a.kind === 'video');
}

export function PostThumb({
  item,
  size = 64,
  onClick,
}: {
  item: ContentItemDTO;
  size?: number;
  onClick?: () => void;
}) {
  const url = coverUrl(item);
  return (
    <div
      onClick={onClick}
      className={[
        'relative shrink-0 overflow-hidden rounded-md bg-nude-light',
        onClick ? 'cursor-pointer hover:opacity-90' : '',
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-ink/30">
          sem imagem
        </div>
      )}
      {isReel(item) && (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] text-white">
          ▶ Reel
        </span>
      )}
    </div>
  );
}

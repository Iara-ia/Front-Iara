// Ícone de marca de cada rede social (cores oficiais), via react-icons/Simple Icons.
// Fonte única do ícone+cor por plataforma — usado na tela de Redes e no modal de conexão.
import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiFacebook,
  SiX,
  SiThreads,
  SiPinterest,
  SiKuaishou,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import type { SocialPlatform } from '@iara/contracts';

const MAP: Record<string, { Icon: IconType; color: string }> = {
  INSTAGRAM: { Icon: SiInstagram, color: '#E1306C' },
  TIKTOK: { Icon: SiTiktok, color: '#111111' },
  YOUTUBE: { Icon: SiYoutube, color: '#FF0000' },
  FACEBOOK: { Icon: SiFacebook, color: '#1877F2' },
  X: { Icon: SiX, color: '#111111' },
  THREADS: { Icon: SiThreads, color: '#111111' },
  PINTEREST: { Icon: SiPinterest, color: '#BD081C' },
  KWAI: { Icon: SiKuaishou, color: '#FF6200' },
};

const FALLBACK = { Icon: SiInstagram, color: '#C2693F' };

export const platformColor = (p: string): string => MAP[p]?.color ?? FALLBACK.color;

export function PlatformIcon({
  platform,
  size = 20,
  className,
}: {
  platform: SocialPlatform | string;
  size?: number;
  className?: string;
}) {
  const m = MAP[platform] ?? FALLBACK;
  const Icon = m.Icon;
  return <Icon size={size} color={m.color} className={className} aria-hidden />;
}

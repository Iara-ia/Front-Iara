// Metadados das redes sociais (rótulo + ícone + se já publica de verdade via Ayrshare).
// Fonte de verdade do "leque" de redes que o painel mostra para conectar/escolher.
import type { SocialPlatform } from '@iara/contracts';

export interface PlatformMeta {
  key: SocialPlatform;
  label: string;
  icon: string;
  realReady: boolean; // true = Ayrshare publica; false = só mock por ora (liga depois)
}

export const PLATFORMS: PlatformMeta[] = [
  { key: 'INSTAGRAM', label: 'Instagram', icon: '▣', realReady: true },
  { key: 'TIKTOK', label: 'TikTok', icon: '♪', realReady: true },
  { key: 'YOUTUBE', label: 'YouTube', icon: '▶', realReady: true },
  { key: 'FACEBOOK', label: 'Facebook', icon: 'f', realReady: true },
  { key: 'X', label: 'X (Twitter)', icon: '𝕏', realReady: true },
  { key: 'THREADS', label: 'Threads', icon: '@', realReady: true },
  { key: 'PINTEREST', label: 'Pinterest', icon: 'P', realReady: true },
  { key: 'KWAI', label: 'Kwai', icon: 'K', realReady: false },
];

export const platformMeta = (k: string): PlatformMeta =>
  PLATFORMS.find((p) => p.key === k) ?? { key: k as SocialPlatform, label: k, icon: '◍', realReady: false };

// ============================================================
// @iara/contracts — contrato de API compartilhado com o Back_Iara.
//
// FONTE DE VERDADE: este arquivo é uma CÓPIA VENDORADA dos contratos Zod do back
// (Back_Iara/src/lib/contracts.ts → enums + domain + schemas). O front NÃO valida
// payloads com Zod (isso é trabalho do back); aqui ficam só os TIPOS e os enums
// (const-objects) que o painel consome.
//
// COMO RE-SINCRONIZAR (quando o back mudar um contrato):
//   1. Abra Back_Iara/src/lib/contracts.ts (Zod) + Back_Iara/src/models/dto.ts (domain).
//   2. Para cada `export const XSchema = z.object({...})` cujo `XInput` o front use,
//      reescreva o tipo `XInput` aqui à mão (mesmos campos/opcionalidade).
//   3. Para enums e DTOs, copie 1:1 as definições de enums.ts / domain.ts.
//   4. Rode `npm run typecheck` no front — o TS aponta qualquer divergência de uso.
//
// EVOLUÇÃO FUTURA (não agora): publicar `@iara/contracts` como pacote no GitHub
// Packages (registry + token), e o front passa a `npm i @iara/contracts` em vez de
// vendorar este arquivo. Mantido como cópia local enquanto não há registry/token.
// ============================================================

// ---------------------- ENUMS (const-objects) ----------------------

export const Role = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const PersonaStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const;
export type PersonaStatus = (typeof PersonaStatus)[keyof typeof PersonaStatus];

export const ContentStatus = {
  RASCUNHO: 'RASCUNHO',
  GERADO: 'GERADO',
  EM_REVISAO: 'EM_REVISAO',
  APROVADO: 'APROVADO',
  AGENDADO: 'AGENDADO',
  PUBLICADO: 'PUBLICADO',
  FALHOU: 'FALHOU',
  REPROVADO: 'REPROVADO',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

// Colunas visíveis no kanban (gerado → em revisão → aprovado).
export const KANBAN_COLUMNS: ContentStatus[] = [
  ContentStatus.GERADO,
  ContentStatus.EM_REVISAO,
  ContentStatus.APROVADO,
];

export const ContentType = {
  POST: 'POST',
  REEL: 'REEL',
  STORY: 'STORY',
  BLOG: 'BLOG',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const SocialPlatform = {
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  YOUTUBE: 'YOUTUBE',
} as const;
export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export const AccountStatus = {
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

// ---------------------- DOMAIN (DTOs serializáveis) ----------------------

export interface FaceRef {
  url: string;
  approved: boolean;
}

export interface VisualProfile {
  loraId: string | null;
  faceRefs: FaceRef[];
  paleta: string[]; // hex
}

export interface Personality {
  systemPrompt: string;
  tom: string;
  do: string[];
  dont: string[];
}

export interface Asset {
  kind: 'image' | 'video' | 'audio';
  url: string;
  width?: number;
  height?: number;
}

export interface AffiliateLink {
  url: string;
  network: string;
  utm?: string;
  cupom?: string;
}

export interface QaFlags {
  consistencyScore?: number;
  safety?: 'pass' | 'flag' | 'block';
  compliance?: string[];
}

export interface PersonaDTO {
  id: string;
  orgId: string;
  name: string;
  bio: string | null;
  niches: string[];
  language: string;
  status: PersonaStatus;
  visualProfile: VisualProfile;
  personality: Personality;
  aiDisclosure: boolean;
  createdAt: string;
}

export interface SocialAccountDTO {
  id: string;
  personaId: string;
  platform: SocialPlatform;
  handle: string;
  status: AccountStatus;
  createdAt: string;
}

export interface ContentItemDTO {
  id: string;
  orgId: string;
  personaId: string;
  type: ContentType;
  pilar: string | null;
  status: ContentStatus;
  assets: Asset[];
  caption: string | null;
  hashtags: string[];
  cta: string | null;
  affiliateLinks: AffiliateLink[];
  qaFlags: QaFlags | null;
  scheduleAt: string | null;
  platforms: SocialPlatform[];
  externalPostIds: Record<string, string> | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface AnalyticsOverviewDTO {
  followers: number;
  reach: number;
  engagementRate: number;
  perPost: Array<{
    contentItemId: string;
    reach: number;
    likes: number;
    comments: number;
  }>;
}

export interface MeResponse {
  userId: string;
  orgId: string;
  orgName: string;
  role: Role;
  email: string;
  name: string | null;
}

// Catálogo de nichos (o "leque" configurável) — resposta de GET /niches.
export interface NicheCatalogItem {
  slug: string;
  label: string;
  category: string;
  hashtags: string[];
  angle: string;
}
export interface NicheCatalog {
  all: NicheCatalogItem[];
  groups: { category: string; niches: NicheCatalogItem[] }[];
}

// ---------------------- ENVELOPE DE RESPOSTA ----------------------

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

// ---------------------- INPUTS (derivados dos schemas Zod do back) ----------------------
// Espelham `z.infer<typeof XSchema>` do back. Mantidos como tipos puros (sem Zod no browser).

export interface UpdatePersonaInput {
  name?: string;
  bio?: string | null;
  niches?: string[];
  language?: string;
  visualProfile?: VisualProfile;
  personality?: Personality;
  aiDisclosure?: boolean;
}

export interface UploadRefsInput {
  urls: string[];
}

export interface ConnectSocialInput {
  personaId: string;
  platform: SocialPlatform;
  handle: string;
}

export interface GenerateContentInput {
  personaId: string;
  count?: number; // 1..7, default 7 no back
  pilares?: string[];
  affiliateLinks?: AffiliateLink[];
}

export interface PatchContentInput {
  caption?: string;
  hashtags?: string[];
  cta?: string | null;
  status?: ContentStatus;
}

export interface ScheduleContentInput {
  scheduleAt: string; // ISO
  platforms: SocialPlatform[];
}

export interface SetAffiliateLinksInput {
  links: AffiliateLink[];
}

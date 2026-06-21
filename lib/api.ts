// Cliente HTTP tipado para a API. Usa os contratos de @iara/contracts.
import type {
  ApiResponse,
  PersonaDTO,
  ContentItemDTO,
  SocialAccountDTO,
  MeResponse,
  NicheCatalog,
  UpdatePersonaInput,
  GenerateContentInput,
  PatchContentInput,
  ScheduleContentInput,
  SetAffiliateLinksInput,
  ConnectSocialInput,
} from '@iara/contracts';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

// Sessão dev (A2): no MVP usamos o owner do seed. Em prod, vem do Clerk/Auth.js.
// Sobrescrevível por env para testar papéis (viewer não aprova).
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? '';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...(DEV_USER_ID ? { 'x-user-id': DEV_USER_ID } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

// ---- Helpers tipados por domínio ----
export const api = {
  me: () => apiFetch<MeResponse>('/me'),

  listNiches: () => apiFetch<NicheCatalog>('/niches'),

  listPersonas: () => apiFetch<PersonaDTO[]>('/personas'),
  getPersona: (id: string) => apiFetch<PersonaDTO>(`/personas/${id}`),
  updatePersona: (id: string, body: UpdatePersonaInput) =>
    apiFetch<PersonaDTO>(`/personas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadRefs: (id: string, urls: string[]) =>
    apiFetch<PersonaDTO>(`/personas/${id}/refs`, {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),

  listContent: (status?: string) =>
    apiFetch<ContentItemDTO[]>(`/content${status ? `?status=${status}` : ''}`),
  generate: (body: GenerateContentInput) =>
    apiFetch<{ created: number; items: ContentItemDTO[] }>('/content/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patchContent: (id: string, body: PatchContentInput) =>
    apiFetch<ContentItemDTO>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  scheduleContent: (id: string, body: ScheduleContentInput) =>
    apiFetch<ContentItemDTO>(`/content/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  setAffiliateLinks: (id: string, body: SetAffiliateLinksInput) =>
    apiFetch<ContentItemDTO>(`/content/${id}/affiliate-links`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listSocial: () => apiFetch<SocialAccountDTO[]>('/social-accounts'),
  connectSocial: (body: ConnectSocialInput) =>
    apiFetch<SocialAccountDTO>('/social-accounts/connect', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  analyticsOverview: () =>
    apiFetch<{ naFila: number; agendados: number; contasConectadas: number }>(
      '/analytics/overview',
    ),
};

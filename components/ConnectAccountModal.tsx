'use client';

// Modal de conexão de conta social no estilo OAuth: deixa explícito que a IARA NUNCA
// recebe a senha — só um token via login oficial da rede. No mock, conecta direto;
// no real (Ayrshare/Meta/TikTok), o botão levaria ao login oficial (window.location).
import { useState } from 'react';
import { api } from '@/lib/api';
import { platformMeta } from '@/lib/platforms';
import { PlatformIcon } from '@/components/PlatformIcon';
import type { SocialPlatform } from '@iara/contracts';

export function ConnectAccountModal({
  personaId,
  personaName,
  platform,
  onClose,
  onConnected,
}: {
  personaId: string;
  personaName: string;
  platform: SocialPlatform;
  onClose: () => void;
  onConnected: () => void;
}) {
  const meta = platformMeta(platform);
  const [handle, setHandle] = useState('@' + personaName.toLowerCase().replace(/\s+/g, ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continuar() {
    if (!handle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // REAL: window.location.href = urlDeLoginOficial (OAuth). MOCK: conecta direto.
      await api.connectSocial({ personaId, platform, handle: handle.trim() });
      onConnected();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-paper p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-nude-light">
            <PlatformIcon platform={platform} size={22} />
          </span>
          <div>
            <h3 className="font-semibold text-ink">Conectar {meta.label}</h3>
            <p className="text-xs text-ink/50">para {personaName}</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-oliva/30 bg-oliva/10 p-3 text-sm">
          <p className="font-medium text-ink">🔒 A IARA nunca vê sua senha.</p>
          <p className="mt-1 text-[13px] text-ink/70">
            Você é levado ao <strong>login oficial do {meta.label}</strong>, onde entra com suas
            credenciais e 2FA. A IARA recebe apenas um <strong>token de acesso</strong> (revogável) —
            guardado criptografado.
          </p>
        </div>

        <label className="mt-4 block text-xs font-medium text-ink/60">
          Handle / @usuário
          <span className="ml-1 font-normal text-ink/40">(dev/mock: simula o retorno do login)</span>
        </label>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="mt-1 w-full rounded-md border border-nude px-3 py-2 text-sm"
          placeholder="@usuario"
        />

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink/60 hover:bg-nude-light"
          >
            Cancelar
          </button>
          <button
            onClick={continuar}
            disabled={busy}
            className="rounded-md bg-terracota px-4 py-2 text-sm font-medium text-paper hover:bg-terracota-dark disabled:opacity-60"
          >
            {busy ? 'Conectando…' : `Continuar para o ${meta.label} →`}
          </button>
        </div>

        {!meta.realReady && (
          <p className="mt-3 text-[11px] text-ink/40">
            {meta.label}: publicação real ainda não coberta pelo provider (Ayrshare) — entra numa
            fase seguinte.
          </p>
        )}
      </div>
    </div>
  );
}

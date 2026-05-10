export function getSameOriginBevoxWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:8001/ws/voice/stream';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${protocol}//${window.location.host}/bevox/ws/voice/stream`;
  }
  return `${protocol}//${window.location.hostname}:8001/ws/voice/stream`;
}

export function resolveBevoxWsUrl(configuredUrl?: string | null): string {
  const sameOriginUrl = getSameOriginBevoxWsUrl();
  const envUrl = process.env.NEXT_PUBLIC_BEVOX_URL
    ? `${process.env.NEXT_PUBLIC_BEVOX_URL.replace(/\/$/, '').replace(/^https/, 'wss').replace(/^http/, 'ws')}/ws/voice/stream`
    : null;
  const candidate = configuredUrl || envUrl;
  if (!candidate || typeof window === 'undefined') return candidate || sameOriginUrl;
  try {
    const url = new URL(candidate);
    if (url.hostname === window.location.hostname && url.port === '8001' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return sameOriginUrl;
    }
  } catch {
    return sameOriginUrl;
  }
  return candidate;
}

export function getMicrophoneErrorMessage(error: unknown): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'O navegador só libera o microfone em HTTPS ou localhost. Acesse a plataforma por HTTPS para usar a aula de voz.';
  }
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'Permissão de microfone negada. Libere o microfone no navegador e tente novamente.';
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') return 'Nenhum microfone foi encontrado neste dispositivo.';
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') return 'O microfone está em uso por outro aplicativo ou não pôde ser iniciado.';
  }
  if (error instanceof Error && error.message === 'microphone_api_unavailable') return 'Este navegador não disponibiliza acesso ao microfone neste contexto.';
  return 'Não foi possível acessar o microfone.';
}

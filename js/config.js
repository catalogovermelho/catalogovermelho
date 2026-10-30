// Supabase → botão "Connect" no topo, ou Project Settings → API Keys.
// Use a "Publishable key" (sb_publishable_…) ou a anon key legada.
// Ela é pública por design: a segurança fica nas políticas RLS.
// Vazio = modo demonstração, com dados salvos só no navegador.
export const SUPABASE_URL = 'https://dsxiluvvunqhwbsvadoj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_KomMUMTRynxDxWGcNTp5sw_uTvzf-CB';

// Cloudflare Turnstile (dash.cloudflare.com → Turnstile): site key pública do captcha.
// Para testar localmente use a chave de teste 1x00000000000000000000AA.
export const TURNSTILE_SITE_KEY = '';

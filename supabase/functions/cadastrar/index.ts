// Edge Function: valida o captcha (Cloudflare Turnstile) e grava o cadastro.
// O público não tem permissão de INSERT na tabela; só esta função grava.
//
// Segredos (Edge Functions → Secrets):
//   TURNSTILE_SECRET   chave secreta do Turnstile
//   ALLOWED_ORIGINS    opcional, ex.: https://catalogovermelho.github.io,http://localhost:8080

const CAMPOS = ['nome', 'instagram', 'categoria', 'descricao', 'site', 'imagem', 'uf', 'cidade', 'lat', 'lng'] as const;
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET')!;
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') ?? '*').split(',').map((o) => o.trim());

function cabecalhosCors(origem: string | null): HeadersInit {
  const permitida = ORIGENS.includes('*') ? '*' : (ORIGENS.includes(origem ?? '') ? origem! : ORIGENS[0]);
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function responder(status: number, corpo: Record<string, unknown>, cors: HeadersInit) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function captchaValido(token: unknown, ip: string | null) {
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const resposta = await fetch(TURNSTILE_URL, { method: 'POST', body: form });
  const { success } = await resposta.json();
  return success === true;
}

/** Copia só os campos permitidos: `aprovado` nunca vem do cliente. */
const extrairEmpresa = (dados: Record<string, unknown>) =>
  Object.fromEntries(CAMPOS.map((campo) => [campo, dados[campo] ?? null]));

Deno.serve(async (req) => {
  const cors = cabecalhosCors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return responder(405, { erro: 'Método não permitido.' }, cors);

  let dados: Record<string, unknown>;
  try {
    dados = await req.json();
  } catch {
    return responder(400, { erro: 'Corpo inválido.' }, cors);
  }

  const ip = req.headers.get('CF-Connecting-IP') ?? req.headers.get('X-Forwarded-For')?.split(',')[0] ?? null;
  if (!(await captchaValido(dados.captcha, ip))) {
    return responder(403, { erro: 'Confirme que você não é um robô.' }, cors);
  }

  const resposta = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(extrairEmpresa(dados)),
  });

  if (resposta.status === 409) return responder(409, { erro: 'Este Instagram já está cadastrado.' }, cors);
  // Violação de CHECK do banco (dados fora das regras) chega como 400.
  if (!resposta.ok) return responder(400, { erro: 'Dados inválidos.' }, cors);
  return responder(201, { ok: true }, cors);
});

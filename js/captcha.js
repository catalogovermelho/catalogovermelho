import { TURNSTILE_SITE_KEY } from './config.js';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let widget = null;

function carregarScript() {
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement('script'), { src: SCRIPT_URL, async: true });
    script.onload = resolve;
    script.onerror = () => reject(new Error('Não foi possível carregar o captcha.'));
    document.head.append(script);
  });
}

/** Mostra o captcha no elemento; carrega o script do Turnstile só quando necessário. */
export async function montarCaptcha(elemento) {
  if (!TURNSTILE_SITE_KEY) throw new Error('Captcha não configurado (TURNSTILE_SITE_KEY).');
  await carregarScript();
  widget = window.turnstile.render(elemento, { sitekey: TURNSTILE_SITE_KEY, language: 'pt-br' });
}

export const tokenCaptcha = () => (widget === null ? '' : window.turnstile.getResponse(widget) ?? '');

/** Cada token vale uma vez: renova após cada envio. */
export function renovarCaptcha() {
  if (widget !== null) window.turnstile.reset(widget);
}

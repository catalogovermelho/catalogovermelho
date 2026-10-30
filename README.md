# Catálogo Vermelho

Catálogo de empresas locais com estética de cartaz construtivista. Site estático (HTML, CSS e JS puro, sem build), pronto para o GitHub Pages.

- Filtros por estado, cidade (lista do IBGE) e ramo, com busca por nome, descrição ou @.
- "Perto de mim": ordena pela distância até a sua localização.
- Cada empresa mostra a imagem cadastrada (link https) ou, sem ela, a foto de perfil do Instagram; tem link para o Instagram, para o site/loja (iFood etc.) e um menu de rota (Google Maps, Waze, Uber, Apple Maps).
- Filtros ficam na URL, então uma busca pode ser compartilhada.
- Cadastro com nome, Instagram e coordenada GPS obrigatórios, que só aparece depois de aprovado.

## Rodar localmente

```sh
npm run dev   # http://localhost:8080
npm test      # testes de validação, distância e links (node:test, sem dependências)
```

Sem configuração o site roda em **modo demonstração**: dados fictícios e cadastros salvos só no navegador.

## Banco de dados (Supabase, plano grátis)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode `supabase/schema.sql`.
3. Clique em **Connect** no topo do painel (ou Project Settings → API Keys) e copie a Project URL e a **Publishable key** (`sb_publishable_…`) para `js/config.js`. A anon key antiga, na aba *Legacy API Keys*, também funciona.

A chave é pública por design. A segurança fica no banco: o público só lê empresas aprovadas (função `buscar_empresas`) e não tem permissão de gravar na tabela. O cadastro passa pela Edge Function `cadastrar`, que exige captcha.

### Captcha anti-spam (Cloudflare Turnstile, grátis)

1. Em [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → *Add widget*. Hostnames: `catalogovermelho.github.io` (e `localhost` para testes). Modo: *Managed*.
2. Copie a **Site Key** para `TURNSTILE_SITE_KEY` em `js/config.js`.
3. No Supabase → **Edge Functions → Secrets**, crie `TURNSTILE_SECRET` com a **Secret Key**. Opcional: `ALLOWED_ORIGINS=https://catalogovermelho.github.io`.
4. Publique a função. Pelo painel: **Edge Functions → Deploy a new function → Via Editor**, nome `cadastrar`, cole `supabase/functions/cadastrar/index.ts` e, nas configurações da função, desligue **Verify JWT**. Ou pela CLI:

   ```sh
   supabase functions deploy cadastrar --no-verify-jwt --project-ref dsxiluvvunqhwbsvadoj
   ```

Chaves de teste do Turnstile (sempre passam): site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

**Moderação:** no Table Editor, marque a caixa `aprovado` da empresa, ou:

```sql
update public.empresas set aprovado = true where id = 123;
```

## Publicar no GitHub Pages

Em Settings → Pages, escolha **GitHub Actions** como fonte. O workflow `.github/workflows/pages.yml` roda os testes e publica a cada push na `main`.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `index.html`, `js/catalogo.js` | Catálogo, filtros e listagem |
| `cadastrar.html`, `js/cadastro.js` | Formulário de cadastro |
| `js/repositorio.js` | Acesso a dados (Supabase via REST ou modo demo) |
| `js/validacao.js` | Regras de cadastro, espelhadas nas constraints do banco |
| `js/links.js` | Links de Instagram e de rota |
| `js/ibge.js` | Lista de cidades (API do IBGE, com cache) |
| `supabase/schema.sql` | Tabela, RLS, índices e função de busca |
| `supabase/functions/cadastrar` | Edge Function: valida captcha e grava cadastro |
| `js/captcha.js` | Widget do Turnstile |

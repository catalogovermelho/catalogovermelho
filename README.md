# Catálogo Vermelho

Catálogo de empresas locais com estética de cartaz construtivista. Site estático (HTML, CSS e JS puro, sem build), pronto para o GitHub Pages.

- Filtros por estado, cidade (lista do IBGE) e ramo, com busca por nome, descrição ou @.
- "Perto de mim": ordena pela distância até a sua localização.
- Cada empresa tem link para o Instagram, para o site/loja (iFood etc.) e um menu de rota (Google Maps, Waze, Uber, Apple Maps).
- Filtros ficam na URL, então uma busca pode ser compartilhada.
- Cadastro com nome, Instagram e coordenada GPS obrigatórios, que entra como **pendente** até ser aprovado.

## Rodar localmente

```sh
npm run dev   # http://localhost:8080
npm test      # testes de validação, distância e links (node:test, sem dependências)
```

Sem configuração o site roda em **modo demonstração**: dados fictícios e cadastros salvos só no navegador.

## Banco de dados (Supabase, plano grátis)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode `supabase/schema.sql`.
3. Em Settings → API, copie a URL e a `anon key` para `js/config.js`.

A anon key é pública por design. A segurança fica no banco: o público só consegue cadastrar (sempre como `pendente`) e só lê empresas aprovadas, via a função `buscar_empresas`.

**Moderação:** aprove no Table Editor mudando `status` para `aprovado`, ou:

```sql
update public.empresas set status = 'aprovado' where id = 123;
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

# Front-Iara

Painel web (Next.js 14 / App Router / Tailwind) da plataforma **IARA**. Standalone — consome a API REST do **Back_Iara**. A IA gera, o humano cura (HITL): o painel é onde o operador revisa, edita e aprova o conteúdo no kanban.

## Telas (MVP, Sprints 0–2)

- `/` — landing simples.
- `/visao-geral` — métricas da operação (itens na fila, agendados, contas conectadas) + papel da sessão.
- `/persona` — edição da persona (bio, nichos, refs faciais, personalidade).
- `/gerar` — disparar geração de lote (mix de pilares), geração assíncrona via fila.
- `/fila` — kanban (Gerado → Em revisão → Aprovado) com drag-and-drop; editar legenda e aprovar (gates no back).

## Rodar

Pré-requisito: o **Back_Iara** rodando em `http://localhost:3333` (API + worker + Postgres/Redis via Infra_Iara), com o seed aplicado.

```bash
npm install
cp .env.local.example .env.local   # ajuste se a API não estiver em :3333
npm run dev                         # painel em http://localhost:3000
```

## Contratos de API (`lib/contracts.ts`)

O front NÃO importa o pacote do back. Os tipos do contrato (enums, DTOs, inputs) vivem
em [`lib/contracts.ts`](lib/contracts.ts), uma **cópia vendorada** da fonte de verdade
(`Back_Iara/src/lib/contracts.ts` em Zod). O cabeçalho do arquivo explica como
re-sincronizar quando o back mudar um contrato.

> Evolução futura: publicar `@iara/contracts` no GitHub Packages (registry + token) e
> trocar a cópia por `npm i @iara/contracts`. Não está habilitado agora.

## Scripts

| Script | O quê |
| --- | --- |
| `npm run dev` | dev server (porta 3000) |
| `npm run build` | build de produção |
| `npm run start` | serve o build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

## Variáveis de ambiente

Ver `.env.local.example`. Todas com prefixo `NEXT_PUBLIC_` (lidas no browser). Nenhum
segredo do back vive aqui.

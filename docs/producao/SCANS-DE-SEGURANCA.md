# Scans de Seguranca

## Objetivo

Definir o que a CI inspeciona, quais achados bloqueiam merge e como uma excecao precisa ser
registrada. Scan verde reduz risco conhecido; nao substitui revisao, threat model, pentest ou
auditoria externa dos contratos.

## Gates automatizados

| Alvo | Ferramenta e escopo | Bloqueio |
| --- | --- | --- |
| Repositorio | Trivy `fs`: vulnerabilidades, misconfiguracao e segredos | High ou critical |
| Backend Python | `pip-audit` sobre `uv.lock` | High ou critical conhecido |
| Frontend | `npm audit --omit=dev` sobre `package-lock.json` | High ou critical |
| Imagem backend | Trivy `image`, tipos `os,library` | High ou critical, inclusive sem fix |
| Postgres/Redis local | Trivy `image`, tipo `os` | High ou critical nos pacotes Alpine |
| Solidity | Slither 0.11.5, dependencias excluidas | Finding high |
| Contratos | Foundry unit, fuzz e invariant | Qualquer falha ou revert inesperado |

O Trivy Action esta fixado pelo commit completo correspondente a `v0.36.0`; o binario usado pela
CI esta fixado em `v0.70.0`. O banco de CVEs vem de `ghcr.io/aquasecurity/trivy-db:2` para evitar
dependencia do mirror que falhou durante a validacao local.

## Escopo das imagens de infraestrutura

`docker-compose.yml` existe para desenvolvimento e CI. A arquitetura de producao exige PostgreSQL
e Redis gerenciados; essas imagens nao sao artefatos implantados do produto.

O scan completo do Postgres oficial em 2026-08-06 encontrou CVEs da stdlib Go dentro de `gosu`.
Esse executavel apenas troca o UID no entrypoint e nao usa TLS, HTTP/2, MIME ou parsing de e-mail,
que eram os componentes reportados. Por isso o gate das imagens locais usa o escopo `os`, previsto
pelo Trivy para pacotes gerenciados por `apk`. Esta e uma decisao de escopo, nao uma supressao
silenciosa: deve ser reavaliada quando o digest do Postgres mudar.

## Excecoes

Um finding high/critical so pode ser aceito quando houver um registro contendo:

1. CVE/finding, componente, versao e artefato afetado.
2. Analise de explorabilidade no fluxo real.
3. Mitigacao compensatoria e evidencia de teste.
4. Responsavel, aprovador e data de expiracao.
5. Issue de remediacao ou dependencia do fornecedor.

Excecao vencida bloqueia o release. `ignore-unfixed` permanece falso; ausencia de patch, por si so,
nao autoriza ignorar uma vulnerabilidade do runtime do produto.

## Evidencia local da fase 10

Em 2026-08-09 passaram:

- locks de Python e npm: zero high/critical;
- repositorio: zero segredo e zero misconfiguracao;
- backend Alpine: zero high/critical em SO e bibliotecas Python;
- Postgres e Redis locais: zero high/critical em pacotes do SO;
- Slither: nenhum finding high;
- Foundry: 10 testes, incluindo fuzz e duas invariantes.

O run hospedado da CI e a protecao de branch continuam obrigatorios antes da aprovacao do G0.

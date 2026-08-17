# Requisitos de Produto

## Objetivo comercial

Permitir que clientes e freelancers contratem trabalho digital com pagamento em USDC por
milestones, mantendo escopo e evidencias privados e usando a Base para custodia programatica e
liquidacao. O primeiro mercado deve ser deliberadamente limitado; marketplace global generico,
cross-chain e account abstraction nao pertencem ao primeiro release comercial.

## Papeis

| Papel | Responsabilidade |
| --- | --- |
| Visitante | Entender o produto, consultar jobs publicos permitidos e iniciar conexao. |
| Cliente | Criar job, selecionar freelancer, financiar, revisar, aprovar ou disputar. |
| Freelancer | Configurar perfil, demonstrar interesse, aceitar termos, entregar e disputar. |
| Arbitro | Consultar somente disputas atribuidas, analisar evidencias e registrar decisao. |
| Suporte | Atender usuarios sem poder movimentar fundos ou decidir disputas. |
| Operador | Monitorar infraestrutura, indexador e incidentes sem acessar evidencias por padrao. |
| Administrador on-chain | Executar apenas funcoes governadas por multisig e politica publicada. |

## Jornadas obrigatorias

### J-01: onboarding e identidade

1. Conectar wallet injetada ou WalletConnect.
2. Validar rede e exibir endereco/chain reais.
3. Autenticar por SIWE.
4. Aceitar termos e politica de privacidade versionados.
5. Criar perfil com papel, disponibilidade, skills e visibilidade.
6. Retomar sessao sem pedir assinatura a cada pagina.

### J-02: criacao de job

1. Cliente informa titulo, resumo publico, descricao privada e criterios de aceite.
2. Define milestones, valores, datas e regra de revisao.
3. Seleciona ou convida um freelancer.
4. Ambas as partes revisam resumo economico e regras de disputa.
5. Cliente cria o job on-chain, autoriza USDC e financia.
6. Produto acompanha cada transacao ate receipt e indexacao.

### J-03: descoberta e match

1. Freelancer ve somente jobs elegiveis e publicos.
2. Score explica sinais usados; nao pode ser um numero arbitrario.
3. Interesse e persistido para o usuario autenticado.
4. Cliente aceita ou rejeita o interesse.
5. Match cria canal de negociacao, mas nao cria obrigacao financeira antes do funding.

### J-04: entrega e aprovacao

1. Freelancer envia arquivo/nota para storage privado.
2. API gera manifesto e compromisso criptografico.
3. Freelancer revisa o manifesto e submete o `bytes32` no milestone correto.
4. Cliente recebe notificacao, acessa evidencia autorizada e aprova ou pede revisao.
5. A interface mostra prazo restante e consequencia do timeout.

### J-05: disputa

1. Participante escolhe milestone, motivo e evidencias.
2. Produto mostra custos, SLA, arbitro e possiveis resultados antes da assinatura.
3. Arbitro recebe workspace imutavel e trilha de auditoria.
4. Decisao registra justificativa off-chain e compromisso on-chain.
5. Partes recebem resultado, transacao, valores e canal de suporte/recurso previsto em politica.

### J-06: cancelamento e saidas

- Cancelamento antes do funding sem assinatura da contraparte.
- Cancelamento mutuo depois do funding com resumo legivel dos splits.
- Reembolso por nao inicio/nao entrega conforme prazo contratual.
- Saida de emergencia prevista quando arbitro ou plataforma estiver indisponivel.

### J-07: operacao e suporte

- Painel de transacoes falhas, indexacao atrasada, disputas vencendo e usuarios bloqueados.
- Busca por job, wallet e tx hash sem expor conteudo privado.
- Acoes de suporte registradas em audit log.
- Nenhum operador pode aprovar pagamento em nome de um cliente.

## Requisitos funcionais

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-01 | Login SIWE com EOA e smart accounts ERC-1271. | P0 |
| RF-02 | WalletConnect e injected wallet usando o mesmo provider abstrato. | P0 |
| RF-03 | Criacao completa de job e metadados antes do registro on-chain. | P0 |
| RF-04 | Historico de transacoes e estados confirmados/revertidos. | P0 |
| RF-05 | Upload privado verificavel e autorizacao por participante. | P0 |
| RF-06 | Timeline derivada de dados reais, com datas e valores exatos. | P0 |
| RF-07 | Painel de arbitragem separado e protegido. | P0 |
| RF-08 | Notificacoes de funding, entrega, revisao, timeout e disputa. | P1 |
| RF-09 | Busca, filtros, paginacao e estados vazios reais. | P1 |
| RF-10 | Score de match explicavel ou ausencia honesta de score. | P1 |
| RF-11 | Exportacao de comprovantes e historico do contrato. | P1 |
| RF-12 | Exclusao/anonimizacao de dados off-chain quando legalmente aplicavel. | P1 |

## Requisitos nao funcionais

- Interface responsiva a partir de 320 px, teclado completo e contraste WCAG 2.2 AA.
- APIs mutaveis idempotentes quando aplicavel e protegidas contra replay.
- P95 de leitura da API abaixo de 500 ms sem incluir RPC externo.
- Nenhum segredo, PII ou evidencia em logs de aplicacao.
- Todas as datas em UTC no backend e formatadas no locale no frontend.
- Mensagens de erro orientam recuperacao sem expor stack trace ou detalhe sensivel.
- Operacoes financeiras mostram token, rede, contrato, valor bruto, fee e valor liquido.
- Compatibilidade documentada com navegadores e wallets suportados.

## Fora do primeiro release comercial

- Outras stablecoins, outras chains e bridges.
- Token proprio, governanca por token ou reputacao soulbound.
- Paymaster, passkeys e ERC-4337 patrocinado.
- Arbitragem totalmente descentralizada.
- Recomendacao por IA sem base de dados e avaliacao adequadas.
- Custodia centralizada de chaves ou fundos pela plataforma.

Esses itens so entram depois de metricas reais de ativacao, funding, conclusao e disputa.

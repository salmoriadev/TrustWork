# Compliance e Comercializacao

## Escopo

Este documento e um checklist de produto e governanca, nao parecer juridico. A empresa deve obter
opiniao formal nas jurisdicoes em que opera antes de aceitar valor real.

## Decisoes juridicas bloqueantes

1. Entidade contratante, jurisdicao e mercados permitidos.
2. Classificacao do servico: software nao custodial, intermediacao, custodia, arbitragem ou
   combinacao dessas atividades.
3. Responsabilidade por chaves administrativas, pause, selecao de arbitro e atualizacao de fee.
4. Necessidade de autorizacao, KYC/KYB, AML, sancoes e monitoramento de transacoes.
5. Tratamento fiscal de fees, pagamentos internacionais, reembolsos e ganhos dos usuarios.
6. Aplicabilidade de regras trabalhistas, consumo, marketplace e resolucao de conflitos.
7. Retencao, exclusao, portabilidade e compartilhamento de dados pessoais/evidencias.

No Brasil, as Resolucoes BCB 519, 520 e 521 entraram em vigor em 2 de fevereiro de 2026 e tratam
de autorizacao e prestacao de servicos de ativos virtuais, governanca, seguranca, PLD/FT e certas
operacoes de cambio. A aderencia depende do desenho efetivo do negocio, nao do rotulo
"nao custodial". Referencias oficiais:

- [Comunicado do Banco Central](https://www.bcb.gov.br/detalhenoticia/20918/nota?s=08)
- [Resolucao BCB 520](https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=520&tipo=Resolu%C3%A7%C3%A3o+BCB)

## Documentos externos obrigatorios

- Termos de uso versionados e aceite comprovavel.
- Politica de privacidade e cookies.
- Politica de escrow, fees, cancelamento, timeout e reembolso.
- Regulamento de arbitragem, conflito de interesses e SLA.
- Politica de conteudo, uso aceitavel e propriedade intelectual.
- Politica de KYC/KYB, sancoes e prevencao a fraude conforme parecer.
- Politica de seguranca e canal de vulnerabilidades.
- Aviso de riscos de stablecoin, blockchain, smart contract, wallet e irreversibilidade.
- Contrato com arbitros e fornecedores que processam dados.

## Privacidade e evidencias

- Mapear controlador, operadores e suboperadores para cada dado.
- Coletar somente o necessario; wallet publica tambem pode se tornar dado pessoal contextual.
- Separar perfil publico, descricao privada, evidencia e dado de compliance.
- Implementar base legal, finalidade, retencao e exclusao por classe de dado.
- Criptografar evidencias e restringir acesso a participantes/arbitro atribuido.
- Registrar acesso e download de evidencia sem registrar seu conteudo em logs.
- Definir como atender direitos do titular sem alterar a historia financeira on-chain.
- Executar avaliacao de impacto para tratamento de alto risco.

## Modelo comercial inicial

### Hipotese recomendada

- Nicho inicial: projetos digitais/Web3 com milestones objetivos.
- Receita: percentual por milestone liberado, publicado antes do funding.
- Sem mensalidade e sem boosts no primeiro beta.
- Fee fixada por job e exibida como bruto, fee e liquido para ambas as partes.
- Arbitragens podem ter fee separada apenas se informada antes do contrato.

O `PLATFORM_FEE_BPS=500` atual representa 5%. Esse numero e uma configuracao tecnica, nao uma
validacao de disposicao a pagar. Deve ser testado com usuarios e comparado ao custo de arbitragem,
suporte, fraude, infraestrutura e aquisicao.

## Unit economics a validar

| Metrica | Pergunta |
| --- | --- |
| GMV | Quanto volume real chega a funding? |
| Take rate liquida | Fee menos gas patrocinado, arbitragem, suporte e perdas. |
| CAC | Quanto custa obter cliente e freelancer ativados? |
| Conversao | Visita -> wallet -> job -> funding -> conclusao. |
| Tempo para liquidez | Quanto demora para um job encontrar contraparte? |
| Taxa de disputa | Quantos jobs exigem custo humano? |
| Perda por fraude | Qual o custo de abuso, chargeback externo e incidente? |
| Retencao | Clientes e freelancers voltam a contratar? |

## Suporte e arbitragem

- Canais, horario, idiomas e SLA publicados.
- Separacao entre suporte tecnico e decisao arbitral.
- Processo de impedimento e substituicao de arbitro.
- Matriz de severidade para fundos presos, evidencia vazada e transacao divergente.
- Registro imutavel de decisoes e comunicacoes relevantes.
- Pagina de status e comunicacao de incidentes.

## Estrategia de rollout

1. **Dogfood testnet:** equipe e parceiros, sem valor real.
2. **Beta convidado:** Base Sepolia, contratos completos e suporte proximo.
3. **Mainnet limitada:** allowlist, cap por job e TVL global, poucos arbitros e monitoramento 24/7.
4. **Expansao:** elevar caps apenas com metricas, auditoria sem findings abertos e capacidade de
   suporte comprovada.

## Gate comercial

Nao cobrar fee ou aceitar valor real antes de:

- Parecer juridico assinado para o modelo e mercados escolhidos.
- Termos, privacidade, arbitragem e riscos publicados.
- Entidade, contabilidade, tributacao e fluxo de treasury definidos.
- KYC/AML/sancoes implementados ou formalmente considerados inaplicaveis pelo parecer.
- Suporte e incident response operacionais.
- Pricing exibido antes da assinatura e sem alteracao retroativa.
- Auditoria tecnica e release gate de mainnet aprovados.

Estratégia de Projeto P2P Automatizado

Visão geral

Este documento descreve uma estratégia em alta para implantar um fluxo de compra de criptomoedas P2P totalmente automatizado com suporte de validação de identidade, pagamento via Pix ou TED e painel administrativo.  A ideia é que o cliente acesse seu site, faça cadastro, passe por uma verificação KYC com a Proteo, escolha o método de depósito, informe o valor, a rede e a carteira onde deseja receber as criptomoedas e receba as moedas após confirmação manual.  O projeto deverá estar em conformidade com as leis brasileiras de prevenção à lavagem de dinheiro e com o LGPD.

Requisitos de conformidade e KYC

Leis e regulamentações
	•	Lei nº 9.613/1998 e circulares do Banco Central – a lei brasileira de prevenção à lavagem de dinheiro exige que instituições supervisionadas identifiquem, verifiquem e monitorem continuamente seus clientes (KYC).  A circular nº 3.978/2020 do Banco Central detalha o uso de uma abordagem baseada em risco e obriga a coleta de informações como nome completo, data de nascimento, endereço, e‑mail, telefone e CPF, bem como a identificação do beneficiário final ￼.  O CPF deve ser verificado nos bancos de dados da Receita Federal ￼.  A lei ainda impõe a retenção de dados e registros de transações por pelo menos cinco anos ￼.
	•	LGPD (Lei Geral de Proteção de Dados) – exige que as empresas coletem apenas dados necessários e informem aos clientes por que os dados são coletados e como serão usados ￼.  Dados devem ser protegidos e excluídos quando não forem mais necessários, respeitando o prazo de retenção da lei 9.613 ￼.

Integração KYC com Proteo

A Proteo (https://www.proteo.com.br/) oferece módulos de Central de Riscos, Background Check e Monitoramento Contínuo.  Esses módulos fornecem “verificação abrangente”, “validação de identidade” e alertas em tempo real de atividades suspeitas ￼.  O fornecedor promete integração simplificada, relatórios detalhados e conformidade regulatória ￼.  Para integrar, é necessário:
	1.	Coleta de dados – no cadastro inicial, solicitar nome completo, CPF, data de nascimento, endereço, telefone e e‑mail, permitindo upload de documento de identidade e selfie.  Esses dados deverão ser enviados à API da Proteo para validação.
	2.	Verificação automática – usar o endpoint de background check da Proteo para validar CPF, cruzar dados com bancos públicos e checar lista de sanções.  Implementar tratamento de erros e mensagens para o cliente caso haja inconsistências.
	3.	Aprovação e armazenamento – após a aprovação da Proteo, armazenar o resultado e somente liberar a criação de depósito quando o KYC for aprovado.  Registrar o ID da verificação e manter os registros por cinco anos conforme exigido pela lei ￼.

Métodos de depósito (Pix x TED)

Comparação de Pix, DOC e TED

O cliente poderá depositar por Pix (pagamento instantâneo) ou TED (transferência eletrônica disponível).  A escolha deve considerar valor, custo e rapidez:

Método
Limite/Valor
Tempo de liquidação
Custo
Observação
Pix
Não há limite mínimo; os participantes podem definir um limite máximo (geralmente R$ 1 000 para pessoas físicas no período entre 20h e 6h)
Instantâneo (24×7)
Gratuito para pessoas físicas
Ideal para valores pequenos e rapidez. Uma vez confirmada, a transação não pode ser cancelada (apenas solicitar devolução) .
TED
Sem limite de valor
Crédito no mesmo dia útil, desde que efetuada até o horário limite do banco
Taxas mais altas, até R$ 50 por transação
Recomendado para depósitos de alto valor devido ao limite maior e maior nível de segurança bancaria.
DOC (opcional)
Limitado a R$ 4 999 por transação
Liquidação no próximo dia útil (T+1)
Taxas baixas (R$ 0–11)
Adequado para transferências de baixo valor programadas, mas menos relevante para transações rápidas.

Recomendação: para depósitos superiores aos limites diários de Pix, orientar o cliente a utilizar TED, pois permite valores ilimitados e processamento no mesmo dia ￼.  Pix continua sendo a melhor opção para valores menores e rapidez.  Informar essas diferenças ao cliente durante a escolha do método de depósito.

Fluxo do usuário
	1.	Cadastro e KYC – O cliente cria uma conta com dados básicos e envia documentos.  O sistema envia as informações à Proteo para verificar identidade (CPF, antecedentes e listas de sanções).  O cadastro só avança se o KYC for aprovado.
	2.	Escolha do depósito – Após aprovação, o cliente acessa a página de depósito.  Nela, escolhe Pix ou TED, informa o valor a depositar, escolhe a rede (blockchain) e insere o endereço da carteira onde receberá as criptomoedas.  O formulário deve conter validação de valor mínimo/máximo e verificação do endereço de carteira.
	3.	Geração de transação – Ao enviar o formulário, o sistema gera um número de transação único.  O usuário é redirecionado para uma página com os dados bancários ou QR Code para depósito via Pix/TED.  Nesta página, inicia‑se um contador regressivo de 40 minutos para concluir o pagamento.
	4.	Notificação e aguardando pagamento – Quando o cliente confirma que realizou o depósito, o sistema envia uma notificação via Pushover ao operador/admin.  Para usar o Pushover, registre um aplicativo e envie uma requisição POST para https://api.pushover.net/1/messages.json contendo token (token do app), user (chave do operador) e message com as informações da transação ￼.  Opcionalmente, use parâmetros como title, priority e ttl para personalizar a notificação ￼.
	5.	Confirmação e envio manual de cripto – O operador acessa o painel administrativo (ver seção abaixo), verifica no banco se o valor chegou e confirma manualmente clicando em “Pagamento recebido”.  Em seguida, transfere as criptomoedas para a carteira indicada pelo cliente.  Após enviar, marca o status como “Valor enviado”.  Todas as mudanças de status são refletidas no painel do cliente em tempo real.  Caso o depósito não seja realizado em 40 minutos, cancelar a transação automaticamente.

Painel administrativo e gerenciamento

Um painel administrativo robusto deve oferecer recursos para gerenciar contas, rastrear transações e garantir conformidade regulatória.  De acordo com um guia de desenvolvimento de exchanges P2P, um painel avançado permite gerenciar contas, acompanhar transações e gerar relatórios analíticos, servindo como ponto de controle central para decisões de alto nível ￼.  Em um fluxo P2P típico há etapas como registro, criação de ofertas, proteção por escrow, pagamento, liberação da cripto e feedback ￼.  O painel deve refletir esse processo e oferecer funcionalidades, como:
	•	Visão geral de transações – lista de todas as transações em andamento com número da transação, nome do cliente, valor, método de depósito, rede e endereço da carteira.
	•	Filtragem e busca – filtros por status (aguardando depósito, pagamento recebido, em conversão, enviado) e ferramentas de busca por CPF ou número de transação.
	•	Notificações internas – integração com Pushover para alertar operadores sobre depósitos pendentes.  Deve ser possível associar chaves de usuário Pushover aos operadores.
	•	Atualização de status – botões para marcar “pagamento recebido”, “trocando” e “enviado”.  Cada alteração atualiza o status para o cliente individualmente; a plataforma deve isolar as atualizações por usuário.
	•	Registros e relatórios – geração de relatórios periódicos para auditoria e conformidade, incluindo logs de KYC, depósitos, envios de cripto e quem efetuou cada ação.  Esses dados devem ser guardados por pelo menos cinco anos ￼.

Implementação técnica

Desenvolvimento do site
	•	Frontend: criar páginas de cadastro e depósito com formulários bem validados.  O temporizador de 40 minutos pode ser implementado em JavaScript (ex.: setInterval) exibindo a contagem regressiva ao usuário.
	•	Backend: usar uma API (Node.js, Python ou outra linguagem) para interagir com a Proteo (KYC), gerar números de transação e armazenar dados em um banco de dados seguro (por exemplo, PostgreSQL).  Implementar endpoints para atualizar status e consultar transações.
	•	Segurança: usar HTTPS, criptografia de dados sensíveis, autenticação multifatorial e logs de auditoria.  Plataformas de P2P precisam de arquitetura de segurança avançada, com autenticação multifatorial, criptografia e detecção de ameaças ￼.

Integração Pushover
	1.	Registrar aplicativo: criar uma aplicação no painel Pushover para obter um APP_TOKEN ￼.
	2.	Obter chave de usuário: cada operador deve informar sua USER_KEY do Pushover.
	3.	Enviar notificação: quando um depósito é confirmado pelo cliente, fazer um POST para https://api.pushover.net/1/messages.json com os parâmetros token, user e message contendo o número da transação e o valor.  Ajustar o priority e o ttl se desejar notificações urgentes ou com tempo de vida específico ￼.

Considerações finais

Este projeto P2P automatizado deve unir automação e interação manual para garantir segurança e conformidade.  A verificação KYC é imprescindível e deve ser realizada antes de qualquer transação, em conformidade com a Lei 9.613 e com as circulares do Banco Central ￼.  É importante comunicar claramente ao cliente as diferenças entre Pix e TED, inclusive limites, custos e tempos de liquidação ￼ ￼.  O painel administrativo, aliado à notificação por Pushover e ao contador regressivo, proporcionará controle preciso sobre cada transação e permitirá um atendimento eficiente e seguro.


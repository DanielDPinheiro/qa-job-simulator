# QA Job Simulator — Sprint Zero | Hotmart MVP 1.1

MVP preparado para validação comercial do produto na Hotmart.

## Rodar localmente

Windows: execute `iniciar.bat`.

Ou no terminal:

```bash
npm start
```

Acesse: http://localhost:3030

## Acesso de demonstração

Código padrão: `QAJOB2026`

Para trocar o código antes de iniciar:

Windows PowerShell:
```powershell
$env:ACCESS_CODE="SEU-CODIGO"; npm start
```

Linux/macOS:
```bash
ACCESS_CODE="SEU-CODIGO" npm start
```

## O que esta versão já entrega

- Tela pós-compra com nome, e-mail e código de acesso
- Boas-vindas personalizadas
- Progresso separado por e-mail
- 11 User Stories / 33 bugs previstos
- 10 minutos por desafio
- Aprovação ou falha por US
- Bug report profissional
- Detalhes, timeline, reteste, aprovação e reabertura
- Gabarito bloqueado durante a simulação e liberado por US após conclusão/falha
- Dashboard de progresso
- Tela de conclusão e certificado interno ao concluir as 11 US
- Identidade QA Job Simulator / Sprint Zero

## Importante antes da venda pública

O código de acesso desta versão é um mecanismo de MVP/beta. Para produção, substitua-o pela autenticação real e pela liberação automática após pagamento aprovado na Hotmart. Também é recomendado migrar a persistência de JSON para PostgreSQL e hospedar o app em HTTPS.

## Fluxo sugerido Hotmart

Compra aprovada → aluno recebe e-mail/código → acessa o QA Job Simulator → valida acesso → onboarding → simulações → conclusão.


## Novidade 1.1 — edição após reteste

Após executar o primeiro reteste de um bug, o detalhe passa a permitir edição de título, severidade, prioridade, passos, resultado atual, resultado esperado, evidência e observações. Ao salvar, o report é reaberto, a identificação do defeito é recalculada e uma nova entrada é criada na timeline. Também foram adicionadas exclusão individual do bug e visual de status/tentativas de reteste.

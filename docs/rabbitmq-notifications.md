# Notificações RabbitMQ do Core Service

## Objetivo

Este documento descreve as mensagens que o `core-service` publica no RabbitMQ para o `notification-service` consumir e enviar emails simples.

O `core-service` apenas publica mensagens. O `notification-service` é responsável por consumir a fila e enviar os emails.

Não usamos templates de email. Não existe campo `type` no payload. O corpo do email é texto simples e deve ser lido do campo `message`.

## Exchange

| Campo | Valor |
|---|---|
| Exchange | `app.events` |
| Tipo | `topic` |

## Routing Key/Fila

| Campo | Valor |
|---|---|
| Routing key | `notification.solicitation.created` |
| Fila | `notification.solicitation.created` |

Atualmente, a mesma routing key `notification.solicitation.created` é usada para criação, aprovação e rejeição de solicitações.

## Formato Padrão do Payload

O `notification-service` deve usar apenas os campos abaixo:

- `recipients`
- `subject`
- `message`
- `data`

Formato base:

```json
{
  "recipients": ["email@exemplo.com"],
  "subject": "Assunto do email",
  "message": "Corpo do email em texto simples.",
  "data": {
    "requestId": "uuid",
    "userId": "uuid",
    "userName": "Nome do motorista",
    "userEmail": "motorista@email.com",
    "vehicleId": "uuid",
    "vehicleName": "Nome/modelo do veículo",
    "vehiclePlate": "ABC1234",
    "reason": "Motivo da solicitação",
    "status": "pending",
    "startsAt": "2029-08-20T08:00:00.000Z",
    "endsAt": "2029-08-20T10:00:00.000Z"
  }
}
```

## Campos do Payload

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `recipients` | `string[]` | Sim | Lista de emails que devem receber a mensagem. O `notification-service` deve enviar email para todos os endereços da lista. |
| `subject` | `string` | Sim | Assunto do email. Deve ser usado diretamente como subject da mensagem. |
| `message` | `string` | Sim | Corpo do email em texto simples. Não há template. |
| `data.requestId` | `string` | Sim | ID da solicitação relacionada ao evento. |
| `data.userId` | `string` | Sim | ID do motorista/usuário dono da solicitação. |
| `data.userName` | `string` | Sim | Nome do motorista/usuário dono da solicitação. |
| `data.userEmail` | `string` | Sim | Email do motorista/usuário dono da solicitação. |
| `data.vehicleId` | `string` | Sim | ID do veículo solicitado. |
| `data.vehicleName` | `string` | Sim | Nome/modelo do veículo solicitado. |
| `data.vehiclePlate` | `string` | Sim | Placa do veículo solicitado. |
| `data.reason` | `string` | Sim | Motivo informado na solicitação. |
| `data.status` | `string` | Sim | Status da solicitação no fluxo. Valores atuais: `pending`, `approved` ou `rejected`. |
| `data.startsAt` | `string` | Sim | Data/hora prevista de início da solicitação em ISO 8601. |
| `data.endsAt` | `string` | Sim | Data/hora prevista de fim da solicitação em ISO 8601. |

## Fluxos Publicados

### 1. Motorista cria uma solicitação

| Item | Descrição |
|---|---|
| Evento de negócio | Nova solicitação criada |
| Quem recebe email | Todos os admins |
| Subject esperado | `Nova solicitação de veículo` |
| `data.status` | `pending` |

Payload exemplo:

```json
{
  "recipients": ["admin@sif.com"],
  "subject": "Nova solicitação de veículo",
  "message": "Uma nova solicitação de veículo foi criada. Motorista: Carlos. Veículo: Fiat Uno. Placa: ABC1234. Motivo: Visita técnica...",
  "data": {
    "requestId": "uuid",
    "userId": "uuid",
    "userName": "Carlos Motorista",
    "userEmail": "carlos.motorista@email.com",
    "vehicleId": "uuid",
    "vehicleName": "Fiat Uno",
    "vehiclePlate": "ABC1234",
    "reason": "Visita técnica em unidade externa",
    "status": "pending",
    "startsAt": "2029-08-20T08:00:00.000Z",
    "endsAt": "2029-08-20T10:00:00.000Z"
  }
}
```

### 2. Admin aprova uma solicitação

| Item | Descrição |
|---|---|
| Evento de negócio | Solicitação aprovada |
| Quem recebe email | Motorista que criou a solicitação |
| Subject esperado | `Sua solicitação de veículo foi aprovada` |
| `data.status` | `approved` |

Payload exemplo:

```json
{
  "recipients": ["carlos.motorista@email.com"],
  "subject": "Sua solicitação de veículo foi aprovada",
  "message": "Sua solicitação de veículo foi aprovada. Veículo: Fiat Uno. Placa: ABC1234. Motivo: Visita técnica...",
  "data": {
    "requestId": "uuid",
    "userId": "uuid",
    "userName": "Carlos Motorista",
    "userEmail": "carlos.motorista@email.com",
    "vehicleId": "uuid",
    "vehicleName": "Fiat Uno",
    "vehiclePlate": "ABC1234",
    "reason": "Visita técnica em unidade externa",
    "status": "approved",
    "startsAt": "2029-08-20T08:00:00.000Z",
    "endsAt": "2029-08-20T10:00:00.000Z"
  }
}
```

### 3. Admin rejeita uma solicitação

| Item | Descrição |
|---|---|
| Evento de negócio | Solicitação recusada |
| Quem recebe email | Motorista que criou a solicitação |
| Subject esperado | `Sua solicitação de veículo foi recusada` |
| `data.status` | `rejected` |

Payload exemplo:

```json
{
  "recipients": ["carlos.motorista@email.com"],
  "subject": "Sua solicitação de veículo foi recusada",
  "message": "Sua solicitação de veículo foi recusada. Veículo: Fiat Uno. Placa: ABC1234. Motivo: Visita técnica...",
  "data": {
    "requestId": "uuid",
    "userId": "uuid",
    "userName": "Carlos Motorista",
    "userEmail": "carlos.motorista@email.com",
    "vehicleId": "uuid",
    "vehicleName": "Fiat Uno",
    "vehiclePlate": "ABC1234",
    "reason": "Visita técnica em unidade externa",
    "status": "rejected",
    "startsAt": "2029-08-20T08:00:00.000Z",
    "endsAt": "2029-08-20T10:00:00.000Z"
  }
}
```

## Responsabilidades do Notification Service

- Consumir mensagens da fila `notification.solicitation.created`.
- Enviar email para todos os endereços presentes em `recipients`.
- Usar `subject` como assunto do email.
- Usar `message` como corpo do email.
- Tratar `message` como texto simples.
- Usar `data` apenas para auditoria, logs ou uso futuro.
- Não depender de campo `type`, pois ele não existe.
- Não aplicar templates, pois o core-service já envia o texto final em `message`.

## Regras de Consumo

- Validar se `recipients` existe e tem pelo menos um email.
- Validar se `subject` existe e não está vazio.
- Validar se `message` existe e não está vazio.
- Se o email for enviado com sucesso, dar `ACK` na mensagem.
- Se ocorrer falha temporária no envio, o `notification-service` pode dar `NACK` com requeue conforme sua estratégia de retry.
- Se o payload for inválido, logar o erro e descartar a mensagem ou enviar para DLQ, se houver DLQ configurada.

## Observações

- Atualmente a mesma routing key `notification.solicitation.created` é usada para criação, aprovação e rejeição.
- A distinção entre os fluxos pode ser feita pelo `subject` ou por `data.status`.
- Como não usamos campo `type`, o `notification-service` não deve depender de `type`.
- O corpo do email é texto simples no campo `message`.
- O campo `data` existe para auditoria, logs ou uso futuro.

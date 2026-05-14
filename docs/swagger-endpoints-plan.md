Everton Gean de Oliveira Pinheiro
Sara Maria Alves de Lima
Vitor Junior Silva Alves
João Manoel Fontes Carneiro

# Planejamento inicial de endpoints - Swagger/OpenAPI

Este planejamento foi criado a partir da varredura das rotas em `src/routes`, dos contratos Zod em `src/contracts`, dos domínios em `src/domains` e dos casos de uso em `src/use-cases`.

## Swagger

- Especificação JSON: `GET /docs/json`
- Especificação YAML: `GET /docs/yaml`
- Autenticação protegida: `Authorization: Bearer <token>`
- Esquema de segurança OpenAPI: `bearerAuth`
- Base local: `http://localhost:3333`

Para uma interface visual, o próximo passo é instalar `@fastify/swagger-ui` e expor uma rota como `/docs`.

## Matriz de endpoints atuais

| Módulo | Método | Caminho | Acesso | Resposta principal | Objetivo |
|---|---:|---|---|---:|---|
| Auth | POST | `/auth` | Público | 200 | Autenticar usuário e emitir JWT |
| Auth | POST | `/admin/auth` | Público | 200 | Autenticar admin e emitir JWT |
| Admin | GET | `/admin` | Admin | 200 | Validar acesso administrativo |
| Usuários | POST | `/admin/users` | Admin | 201 | Criar usuário |
| Usuários | GET | `/admin/users` | Admin | 200 | Listar usuários |
| Usuários | GET | `/admin/users/{id}` | Admin | 200 | Buscar usuário por ID |
| Usuários | PUT | `/admin/users/{id}` | Admin | 200 | Atualizar usuário |
| Usuários | DELETE | `/admin/users/{id}` | Admin | 204 | Remover usuário |
| Veículos | GET | `/admin/vehicles` | Admin | 200 | Listar todos os veículos |
| Veículos | POST | `/admin/vehicles` | Admin | 201 | Cadastrar veículo |
| Veículos | GET | `/vehicles` | Driver/Admin | 200 | Listar veículos disponíveis |
| Veículos | PUT | `/admin/vehicles/{id}` | Admin | 200 | Atualizar veículo |
| Veículos | DELETE | `/admin/vehicles/{id}` | Admin | 204 | Remover veículo |
| Solicitações | POST | `/requests` | Driver/Admin | 201 | Criar solicitação de uso de veículo |
| Solicitações | GET | `/requests/{userId}` | Driver/Admin | 200 | Listar solicitações por usuário |
| Solicitações | GET | `/requests/{vehicleId}/schedule` | Driver/Admin | 200 | Consultar agenda de um veículo |
| Solicitações | GET | `/admin/requests` | Admin | 200 | Listar todas as solicitações |
| Solicitações | GET | `/admin/requests/{vehicleId}` | Admin | 200 | Listar solicitações por veículo |
| Solicitações | PUT | `/admin/requests/{requestId}/approve` | Admin | 200 | Aprovar solicitação pendente |
| Solicitações | PUT | `/admin/requests/{requestId}/reject` | Admin | 200 | Rejeitar solicitação pendente |
| Rotas | POST | `/routes/{requestId}` | Driver/Admin | 201 | Iniciar rota a partir de solicitação aprovada |
| Rotas | PUT | `/routes/{routeId}` | Driver/Admin | 200 | Finalizar rota iniciada |
| Uploads | POST | `/admin/upload/presigned` | Admin | 200 | Gerar URL pré-assinada para upload |

## Schemas documentados no Swagger

| Grupo | Schemas de entrada | Schemas de resposta |
|---|---|---|
| Auth | `userLoginSchema` | `authResponseSchema` |
| Usuários | `createUserSchema`, `updateUserSchema`, `userIdParamSchema` | `userResponseSchema` |
| Veículos | `vehicleRequestSchema`, `vehicleParamsSchema` | `vehicleResponseSchema` |
| Solicitações | `createRequestSchema`, `requestIdParamSchema`, `requestUserIdParamSchema`, `requestVehicleIdParamSchema` | `requestResponseSchema`, `requestScheduleResponseSchema` |
| Rotas | `requestIdParamSchema`, `routeIdParamSchema`, `finishRouteSchema` | `routeResponseSchema` |
| Uploads | `uploadPresignedSchema` | `uploadPresignedResponseSchema` |

## Fases sugeridas

1. Contrato base da API
   - Manter `tags`, `summary`, `description` e `security` em todas as rotas.
   - Padronizar erros em um contrato único, por exemplo `{ "message": "..." }`.
   - Documentar respostas comuns: `400`, `401`, `403`, `404` e `500`.

2. CRUD administrativo
   - Consolidar usuários e veículos como recursos administrativos.
   - Adicionar paginação e filtros em listas administrativas antes do volume crescer.
   - Considerar endpoints de detalhe faltantes, como `GET /admin/vehicles/{id}`.

3. Fluxo de solicitações
   - Documentar a transição `PENDING -> APPROVED/REJECTED -> COMPLETED`.
   - Definir se `POST /requests` deve aceitar `userId` no corpo ou usar sempre o usuário do token.
   - Considerar `GET /requests/{requestId}` para consulta de uma solicitação específica.

4. Fluxo de rotas
   - Documentar a transição `APPROVED -> STARTED -> FINISHED`.
   - Considerar `GET /routes/{routeId}` e listagens por usuário, veículo ou solicitação.

5. Uploads
   - Restringir e documentar tipos aceitos em `contentType`.
   - Definir limite de tamanho e ciclo de vida das URLs pré-assinadas.

6. Auditoria e observabilidade
   - O domínio de audit logs já existe, mas ainda não há rota pública.
   - Planejar `GET /admin/audit-logs` com filtros por ação, entidade, usuário e período.

## Pontos de atenção encontrados

- O formato de erro ainda varia entre `{ "message": "..." }` e `{ "error": "..." }`.
- As rotas protegidas usam JWT e autorização por papel, mas as respostas de erro ainda não estão detalhadas em cada schema.
- Campos de data usam `z.date()`/`z.coerce.date()`; no OpenAPI devem ser enviados como strings `date-time`.
- Respostas `204` devem ser tratadas como sem corpo, mesmo que o handler envie `null`.
- O Swagger UI ainda não está instalado; por enquanto a aplicação expõe o documento OpenAPI em JSON/YAML.

# Design

## Current Flow

`src/routes/route-router.ts` handles `POST /routes/:requestId` and calls `startRouteUseCase(requestId, performedBy)`.

`startRouteUseCase`:

1. Loads the request.
2. Verifies it is approved.
3. Ensures no route already exists for the request.
4. Inserts the route with `STARTED` status.
5. Writes an audit log.
6. Returns `routeResponseSchema.parse(route)`.

There is no real-time delivery path for admin clients.

## Event Contract

SSE event name: `route.started`

Payload:

```json
{
  "type": "route.started",
  "routeId": "uuid",
  "vehicle": {
    "id": "uuid",
    "model": "string"
  },
  "driver": {
    "id": "uuid",
    "name": "string"
  },
  "startedAt": "iso-date-string"
}
```

`driver` should be included because the request already points to `userId`, and the admin notification becomes more useful with the driver name. If the team wants the smallest possible payload, the admin app can ignore it without a backend contract change.

## Backend Shape

Add a route-event module under `src/use-cases` or a small infrastructure folder, for example:

- `src/use-cases/route-event-service.ts`

Responsibilities:

- Keep a `Set` of connected SSE clients.
- Register a client and return a cleanup function.
- Broadcast route-started payloads to all current clients.
- Format SSE messages as `event: route.started` plus JSON `data`.

Add a router, for example:

- `src/routes/route-event-router.ts`

Endpoint:

- `GET /admin/route-events`
- protected by `verifyJwt` and `authorize([USER_ROLES[1]])`
- sets `Content-Type: text/event-stream`
- sets `Cache-Control: no-cache`
- sets `Connection: keep-alive`
- writes an initial connection event or comment to open the stream
- removes the client when the request closes

Register the router in `src/app.ts` with the other routers.

## Publishing From Route Start

After `insertRoute` succeeds and after the audit log is attempted, publish the event.

To avoid delaying or failing route creation because of a notification issue, the SSE publish path should be best-effort:

- load `vehicle` via the request's `vehicleId`
- load `driver` via the request's `userId`
- if either is missing, log a warning and skip the SSE event
- if broadcasting throws, catch and log, but still return the started route

The route-start use case already loads the request, so it should reuse `request.userId` and `request.vehicleId` rather than introducing new route params.

## Admin App Consumption

The admin app should subscribe with `EventSource` to `/admin/route-events` through whatever browser-reachable core-service base URL it already uses.

Because native `EventSource` cannot send custom headers, authentication should be planned carefully. If the current admin auth is cookie-based for browser requests, keep the endpoint cookie/JWT compatible. If the admin app only stores the token server-side, the implementation may need either:

- a same-origin Next.js proxy route that attaches the auth cookie/header to core-service, or
- a token-in-query strategy with short-lived signed tokens.

For this core-service proposal, keep the endpoint protected by existing hooks and validate the admin-app auth path during implementation.

## Risks

- In-memory SSE clients only work per core-service process. If the app runs multiple replicas later, events will only reach clients connected to the same process unless RabbitMQ or another pub/sub layer fans out events.
- Long-lived SSE connections may need reverse proxy timeout configuration.
- If admin authentication is not cookie-compatible in the browser, the frontend may need a proxy endpoint.

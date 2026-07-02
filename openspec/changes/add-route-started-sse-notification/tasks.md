# Tasks

## 1. Add Event Payload Contract

- [x] Create a Zod schema/type for the route-started SSE payload.
- [x] Include `type`, `routeId`, `vehicle.id`, `vehicle.model`, `driver.id`, `driver.name`, and `startedAt`.

## 2. Add SSE Broadcaster

- [x] Create a route event service that tracks connected admin SSE clients.
- [x] Add a `registerRouteEventClient` helper with cleanup on disconnect.
- [x] Add a `publishRouteStartedEvent` helper that writes `event: route.started` and JSON `data` to every client.
- [x] Ensure one broken client does not prevent delivery to other clients.

## 3. Add Admin SSE Route

- [x] Create `src/routes/route-event-router.ts`.
- [x] Add `GET /admin/route-events`.
- [x] Protect it with `verifyJwt` and `authorize([USER_ROLES[1]])`.
- [x] Set SSE headers and write an initial keep-alive comment or connection event.
- [x] Register the router in `src/app.ts`.

## 4. Publish Event When Route Starts

- [x] Update `startRouteUseCase` after successful route creation.
- [x] Load the related vehicle and driver using the existing request data.
- [x] Publish the `route.started` event with route id, vehicle model, and driver data.
- [x] Keep publication best-effort: log errors, but do not fail route start.

## 5. Validate

- [ ] Run TypeScript build or the narrowest available type check.
- [ ] Manually start the API and connect to `GET /admin/route-events` as an admin.
- [ ] Start a route through `POST /routes/:requestId`.
- [ ] Confirm the SSE client receives one `route.started` event with the expected payload.
- [ ] Confirm non-admin users cannot connect to the admin SSE endpoint.

# Add Route Started SSE Notification

## Summary

Add an admin-only Server-Sent Events channel so the core service can notify the Next.js admin app immediately when a route is started.

## Problem

Today `POST /routes/:requestId` starts a route and returns the created route to the caller, but the admin app has no real-time signal that a trip began. Admin users need to see a notification when a route is initiated without polling route or request endpoints.

## Proposed Change

Introduce a new admin SSE endpoint, likely `GET /admin/route-events`, protected by the existing JWT and admin authorization hooks.

When `startRouteUseCase` successfully creates a route, publish a `route.started` event to connected admin SSE clients. The event payload should include:

- `routeId`
- `vehicle.id`
- `vehicle.model`
- `driver.id`
- `driver.name`

The admin app can subscribe to the stream and show a "rota iniciada" notification as soon as the event arrives.

## Non-Goals

- Do not persist these SSE events as notification records in the database.
- Do not replace the existing RabbitMQ notification flow.
- Do not implement the admin app UI in this core-service change.
- Do not add route-finished events unless requested later.

## Impact

- Adds one admin-only streaming route.
- Adds a small in-memory event broadcaster in core-service.
- Extends route-start logic to load the related request, vehicle, and driver data needed for the event payload.

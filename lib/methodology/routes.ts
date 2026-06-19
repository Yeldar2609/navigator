// Professional routes (kept in sync with the seed data and the `careers.route`
// column). Labels live in the i18n dictionaries under `routes.<key>`.

export const ROUTES = [
  'technological',
  'research',
  'managerial',
  'social_humanitarian',
  'creative',
] as const

export type Route = (typeof ROUTES)[number]

export const ROUTE_ORDER: readonly Route[] = ROUTES

export function isRoute(value: string): value is Route {
  return (ROUTES as readonly string[]).includes(value)
}

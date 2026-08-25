export type AdminAccessUser = { role: "user" | "admin" } | null | undefined;
export type AdminRouteState = "loading" | "unauthenticated" | "forbidden" | "authorized";

export function getAdminRouteState(user: AdminAccessUser, loading: boolean): AdminRouteState {
  if (loading) return "loading";
  if (!user) return "unauthenticated";
  return user.role === "admin" ? "authorized" : "forbidden";
}

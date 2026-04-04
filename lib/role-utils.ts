export function normalizeRole(role: string | null | undefined): string {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")

  if (normalized === "subadmin") return "sub-admin"
  return normalized
}

export function resolveDashboardPathByRole(role: string | null | undefined): string {
  const normalized = normalizeRole(role)

  if (normalized === "customer") return "/customer/home"
  if (normalized === "provider") return "/provider"
  if (normalized === "shopkeeper") return "/shopkeeper"
  if (normalized === "admin") return "/admin"
  if (normalized === "sub-admin") return "/sub-admin"
  if (normalized === "secretary") return "/secretary"
  if (normalized === "agent") return "/agent"

  return "/"
}

import type { User } from "@/types/user";
import type { Property } from "@/types/property";
import type { PlanLimits, UserSubscription } from "@/types/subscription";
import { normalizePhone } from "@/lib/subscription-store";

export interface UsageLine {
  key: keyof PlanLimits;
  label: string;
  used: number;
  limit: number | undefined;
}

/** Properties belonging to a directory user (explicit links or matching owner phone). */
export function linkedProperties(user: Pick<User, "phone" | "listedPropertyIds">, properties: Property[]) {
  const phone = normalizePhone(user.phone);
  const ids = new Set(user.listedPropertyIds ?? []);
  return properties.filter((p) => ids.has(p.id) || normalizePhone(p.owner.phone) === phone);
}

/**
 * Usage against plan limits. When the subscriber is in the admin directory,
 * counts come from live records (linked properties, saved list); otherwise the
 * counter recorded on the subscription is used. Every admin screen calls this
 * so the numbers agree.
 */
export function usageFor(sub: UserSubscription, users: User[], properties: Property[]): UsageLine[] {
  const user = users.find((u) => u.role === sub.role && normalizePhone(u.phone) === normalizePhone(sub.subscriberPhone));
  const live = user ? linkedProperties(user, properties).filter((p) => p.status === "Active" || p.status === "Pending").length : undefined;
  const L = sub.snapshot.limits;
  if (sub.role === "buyer") {
    return [{ key: "savedPropertyLimit", label: "Saved", used: user?.savedPropertyIds?.length ?? sub.usage.savedUsed ?? 0, limit: L.savedPropertyLimit }];
  }
  if (sub.role === "owner") {
    return [{ key: "listingLimit", label: "Listings", used: live ?? sub.usage.listingsUsed ?? 0, limit: L.listingLimit }];
  }
  return [
    { key: "locationLimit", label: "Locations", used: sub.usage.locationsUsed ?? 0, limit: L.locationLimit },
    { key: "listingLimit", label: "Listings", used: live ?? sub.usage.listingsUsed ?? 0, limit: L.listingLimit },
  ];
}

export function remaining(line: UsageLine) {
  if (line.limit === undefined || line.limit < 0) return Infinity;
  return Math.max(0, line.limit - line.used);
}

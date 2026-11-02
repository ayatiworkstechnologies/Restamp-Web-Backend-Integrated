import type { AdminPermission } from '@/lib/api/admin';

/** The signed-in admin, as answered by GET /admin/me (never from the token or the browser). */
export interface AdminSession {
  id: string;
  name: string;
  /** Human label of the admin role, e.g. "Super Admin". */
  role: string;
  /** Backend admin role code, e.g. "SUPER_ADMIN". */
  roleCode: string;
  permissions: AdminPermission[];
}

export interface AdminAuthContextType {
  admin: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Set when the signed-in user is not an admin, or /admin/me failed. */
  accessError: string | null;
  /** Re-check admin access with the backend (after signing in). */
  refresh: () => Promise<AdminSession | null>;
  can: (permission: AdminPermission) => boolean;
  logout: () => void;
}

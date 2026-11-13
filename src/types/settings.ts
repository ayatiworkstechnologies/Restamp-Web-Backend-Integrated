export type AdminRoleType =
  | "Super Admin"
  | "Operations Manager"
  | "Listing Reviewer"
  | "Support Specialist";

export type AdminUserStatus = "Active" | "Invited" | "Suspended";

export interface AdminUser {
  id: string; // e.g. "ADM-101"
  name: string;
  email: string;
  phone: string;
  role: AdminRoleType;
  status: AdminUserStatus;
  twoFactorEnabled: boolean;
  department: string;
  lastActive: string;
  createdAt: string;
  avatar?: string;
}

export interface RolePermissions {
  properties: {
    view: boolean;
    approve: boolean;
    reject: boolean;
    edit: boolean;
    delete: boolean;
  };
  users: {
    view: boolean;
    suspend: boolean;
    export: boolean;
  };
  enquiries: {
    view: boolean;
    update_status: boolean;
    delete: boolean;
    export: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  settings: {
    manage_team: boolean;
    configure_platform: boolean;
    view_audit_logs: boolean;
  };
}

export interface RoleDefinition {
  id: string;
  name: AdminRoleType;
  description: string;
  isCustom?: boolean;
  permissions: RolePermissions;
}

export interface PlatformSettings {
  // General Platform Information
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  defaultCity: string;

  // Listing & Compliance Rules
  requireReraNumber: boolean;
  maxImagesPerListing: number;
  autoExpireDays: number;
  allowDirectOwnerContact: boolean;

  // Communications & Notifications
  emailNotifications: boolean;
  whatsappAlerts: boolean;
  adminDailyDigest: boolean;
  smsDispatchOnLead: boolean;

  // Security & Staff Access
  enforce2FA: boolean;
  sessionTimeoutMinutes: number;
  ipRestrictionEnabled: boolean;
  allowedIpSubnets: string;
  maintenanceMode: boolean;
}

export interface SecurityAuditLog {
  id: string;
  actor: string;
  actorEmail: string;
  role: string;
  action: string;
  category: "Auth" | "Listing" | "User" | "Setting" | "Access";
  ipAddress: string;
  timestamp: string;
  status: "Success" | "Warning" | "Blocked";
  details: string;
}

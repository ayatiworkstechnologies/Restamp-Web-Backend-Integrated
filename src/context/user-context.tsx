"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, UserStatus, normalizeUserRole } from "@/types/user";
import { initialUsers } from "@/lib/users-data";
import { usePropertyStore } from "@/context/property-context";

interface UserContextType {
  users: User[];
  stats: {
    total: number;
    buyers: number;
    owners: number;
    agents: number;
    suspended: number;
    active: number;
  };
  suspendUser: (userId: string, reason: string) => void;
  activateUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addUser: (
    newUser: Omit<User, "id" | "joinedDate" | "lastActive" | "auditLog" | "adminNotes" | "initials" | "tint">
  ) => string;
  deleteUser: (userId: string) => void;
  addAdminNote: (userId: string, content: string, adminName?: string) => void;
  batchSuspend: (userIds: string[], reason: string) => void;
  resetToDefaultUsers: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "restamp_admin_users_v1";

const tints = ["#E6EBFF", "#E7F3EC", "#FDF0DB", "#EDE9FE", "#FCE7F3", "#DCFCE7", "#FEF3C7"];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => initialUsers.map(normalizeUserRole));
  const [isHydrated, setIsHydrated] = useState(false);
  const { showToast } = usePropertyStore();

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers((parsed as User[]).map(normalizeUserRole));
        }
      }
    } catch {
      // fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save users to localStorage", e);
    }
  }, [users, isHydrated]);

  const stats = useMemo(() => {
    const total = users.length;
    const buyers = users.filter((u) => u.role === "buyer").length;
    const owners = users.filter((u) => u.role === "owner").length;
    const agents = users.filter((u) => u.role === "agent").length;
    const suspended = users.filter((u) => u.status === "Suspended").length;
    const active = users.filter((u) => u.status === "Active").length;
    return { total, buyers, owners, agents, suspended, active };
  }, [users]);

  const suspendUser = (userId: string, reason: string) => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        return {
          ...user,
          status: "Suspended" as UserStatus,
          suspensionReason: reason,
          auditLog: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              action: "Account Suspended",
              actor: "RESTAMP Admin",
              timestamp,
              details: `Account suspended: ${reason}`,
            },
            ...(user.auditLog || []),
          ],
        };
      })
    );

    showToast(`User ${userId} has been suspended.`, "error");
  };

  const activateUser = (userId: string) => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        return {
          ...user,
          status: "Active" as UserStatus,
          suspensionReason: undefined,
          auditLog: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              action: "Account Re-activated",
              actor: "RESTAMP Admin",
              timestamp,
              details: "Account restored to Active standing.",
            },
            ...(user.auditLog || []),
          ],
        };
      })
    );

    showToast(`User ${userId} is now Active.`);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        return {
          ...user,
          ...updates,
          auditLog: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              action: "Profile Updated",
              actor: "RESTAMP Admin",
              timestamp,
              details: "User profile details modified by admin.",
            },
            ...(user.auditLog || []),
          ],
        };
      })
    );

    showToast(`User ${userId} updated.`);
  };

  const addUser = (
    newUser: Omit<User, "id" | "joinedDate" | "lastActive" | "auditLog" | "adminNotes" | "initials" | "tint">
  ) => {
    const randomNum = Math.floor(2100 + Math.random() * 800);
    const newId = `USR-${randomNum}`;
    const initials = newUser.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const tint = tints[Math.floor(Math.random() * tints.length)];
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, Today`;

    const created: User = {
      ...newUser,
      id: newId,
      initials,
      tint,
      joinedDate: timestamp,
      lastActive: "Just now",
      adminNotes: [],
      auditLog: [
        {
          id: `AUD-${Date.now().toString().slice(-4)}`,
          action: "User Created",
          actor: "Admin",
          timestamp,
          details: `User registered directly via admin console as ${newUser.role}.`,
        },
      ],
    };

    setUsers((prev) => [created, ...prev]);
    showToast(`User ${newId} created successfully!`);
    return newId;
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`User ${userId} was deleted.`, "info");
  };

  const addAdminNote = (userId: string, content: string, adminName: string = "RESTAMP Admin") => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        const newNote = {
          id: `NOTE-${Date.now().toString().slice(-4)}`,
          adminName,
          content,
          timestamp,
        };

        return {
          ...user,
          adminNotes: [newNote, ...(user.adminNotes || [])],
        };
      })
    );

    showToast("Internal admin note added.");
  };

  const batchSuspend = (userIds: string[], reason: string) => {
    if (userIds.length === 0) return;
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-GB")}, Batch`;

    setUsers((prev) =>
      prev.map((user) => {
        if (!userIds.includes(user.id)) return user;

        return {
          ...user,
          status: "Suspended" as UserStatus,
          suspensionReason: reason,
          auditLog: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              action: "Batch Suspended",
              actor: "Admin",
              timestamp,
              details: `Batch suspension: ${reason}`,
            },
            ...(user.auditLog || []),
          ],
        };
      })
    );

    showToast(`Suspended ${userIds.length} users.`, "error");
  };

  const resetToDefaultUsers = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUsers(initialUsers.map(normalizeUserRole));
    showToast("Reset users data to initial seed.", "info");
  };

  return (
    <UserContext.Provider
      value={{
        users,
        stats,
        suspendUser,
        activateUser,
        updateUser,
        addUser,
        deleteUser,
        addAdminNote,
        batchSuspend,
        resetToDefaultUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserStore must be used within a UserProvider");
  }
  return context;
}

"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { LoadingScreen } from "@/components/loading-screen";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, user, router, mounted]);

  if (isLoading || !mounted) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar isHidden={isSidebarHidden} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={() => setIsSidebarHidden((prev) => !prev)}
        />
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="w-full p-4 lg:p-8">{children}</div>
        </main>
        <AdminMobileNav />
      </div>
    </div>
  );
}

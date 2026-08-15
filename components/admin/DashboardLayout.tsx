"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import AdminTopbar from "./AdminTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6f8] lg:flex lg:h-screen lg:overflow-hidden">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-4 lg:px-8 py-4 border-t border-gray-200 bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <p>© 2025 Energy Tail. All rights reserved.</p>
        <p>v1.0.0</p>
      </div>
    </footer>
  );
}

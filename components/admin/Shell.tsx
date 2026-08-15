"use client";

import { useState } from "react";
import ShellSidebar from "./ShellSidebar";
import AdminTopbar from "./AdminTopbar";

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <ShellSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <AdminTopbar variant="dark" onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-gray-200 bg-white px-4 py-4 text-[12px] text-gray-500 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
            <span>© 2025 Energy Tail. All rights reserved.</span>
            <span>Version 1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

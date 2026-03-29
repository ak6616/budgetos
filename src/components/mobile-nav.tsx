"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FileTextIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Expenses", href: "/expenses", icon: ArrowDownIcon },
  { title: "Revenue", href: "/revenue", icon: ArrowUpIcon },
  { title: "Invoices", href: "/invoices", icon: FileTextIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

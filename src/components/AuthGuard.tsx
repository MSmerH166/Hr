"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSettings } from "@/lib/settings";

const USER_KEY = "hr_login_user";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const settings = getSettings();

    if (!settings.requireLogin || pathname === "/login") {
      setAllowed(true);
      return;
    }

    const hasUser =
      typeof window !== "undefined" && localStorage.getItem(USER_KEY);

    if (!hasUser) {
      router.replace("/login");
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) return null;

  return <>{children}</>;
}


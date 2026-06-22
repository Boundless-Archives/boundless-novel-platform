"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      const supabase = createClient();

      await supabase.auth.signOut();

      window.location.href = "/";
    }

    logout();
  }, []);

  return (
    <main className="p-10">
      Logging out...
    </main>
  );
}
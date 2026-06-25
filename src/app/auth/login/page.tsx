"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("Logging in...");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="p-10 max-w-md">
      <h1 className="text-3xl font-bold mb-6">
        Login
      </h1>

      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="border p-2 rounded"
          required
        />
       
        <Button type="submit">
          Login
        </Button>
      </form>

      {message && (
        <p className="mt-4">{message}</p>
      )}
    </main>
  );
}
"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function BecomeAuthorPage() {
  const supabase = createClient();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function becomeAuthor() {
    setLoading(true);
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("You must be logged in.");
      return;
    }
     
    const { error } = await supabase
      .from("profiles")
      .update({
        is_author: true,
      })
      .eq("id", user.id);

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;  
    }

    setMessage("Congratulations! You are now an author.");

    setTimeout(() => {
      router.push("/stories");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="p-10 max-w-xl">
      <h1 className="text-3xl font-bold">
        Become an Author
      </h1>

      <p className="mt-4">
        Becoming an author allows you to publish stories on Boundless.
      </p>
      
      <Button
        type="button"
        onClick={becomeAuthor}
        disabled={loading}
      >
        {loading
          ? "Becoming Author..."
          : "Become an Author"}
      </Button>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}
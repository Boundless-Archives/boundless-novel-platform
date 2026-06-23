"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function BecomeAuthorPage() {
  const supabase = createClient();

  const [message, setMessage] = useState("");

  async function becomeAuthor() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      setMessage(error.message);
      return;
    }

    setMessage(
      "Congratulations! You are now an author."
    );
  }

  return (
    <main className="p-10 max-w-xl">
      <h1 className="text-3xl font-bold">
        Become an Author
      </h1>

      <p className="mt-4">
        Becoming an author allows you to publish stories on Boundless.
      </p>
      
      <Button type="submit">
        Become an Author
      </Button>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}
"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function EditProfilePage() {
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) return;

      setUsername(data.username ?? "");
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
    }

    loadProfile();
  }, [supabase]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated successfully.");
  }

  return (
    <main className="p-10 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">
        Edit Profile
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <input
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          placeholder="Username"
          className="border p-2 rounded"
        />

        <input
          value={displayName}
          onChange={(e) =>
            setDisplayName(e.target.value)
          }
          placeholder="Display Name"
          className="border p-2 rounded"
        />

        <textarea
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          placeholder="Bio"
          className="border p-2 rounded"
          rows={5}
        />
        
        <Button type="submit">
          Save Profile
        </Button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}
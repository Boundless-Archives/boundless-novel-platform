"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function NewStoryPage() {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

    // Check whether a story with this title already exists
    const { data: existingStory } = await supabase
      .from("stories")
      .select("id")
      .eq("title", title)
      .maybeSingle();

    if (existingStory) {
      setMessage(
        "A story with this title already exists."
      );
      return;
    }

    const generatedSlug = createSlug(title);

    const { error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        title,
        slug: generatedSlug,
        description,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Story created successfully.");

    setTitle("");
    setDescription("");
  }

  return (
    <main className="p-10 max-w-2xl">
      <h1 className="text-4xl font-bold mb-6">
        Create Story
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Story Title"
          className="border p-2 rounded"
          required
        />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Story Description"
          rows={6}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="border rounded p-2"
        >
          Create Story
        </button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}
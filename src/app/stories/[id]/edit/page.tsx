"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditStoryPage() {
  const supabase = createClient();

  const params = useParams();
  const storyId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("Draft");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadStory() {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single();

      if (!data) return;

      setTitle(data.title);
      setDescription(
        data.description ?? ""
      );
      setStatus(data.status);
    }

    loadStory();
  }, [storyId, supabase]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const { error } = await supabase
      .from("stories")
      .update({
        title,
        description,
        status,
      })
      .eq("id", storyId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Story updated successfully."
    );
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">
        Edit Story
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
          className="border p-2 rounded"
        />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          rows={6}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          className="border p-2 rounded"
        >
          <option>Draft</option>
          <option>Ongoing</option>
          <option>Completed</option>
          <option>Hiatus</option>
          <option>Dropped</option>
        </select>

        <button
          type="submit"
          className="border rounded p-2"
        >
          Save Changes
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
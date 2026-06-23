"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] =
    useState<File | null>(null);
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

    let coverUrl: string | null = null;

    if (coverFile) {
      const fileExt =
        coverFile.name.split(".").pop();

      const fileName =
        `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } =
        await supabase.storage
          .from("story-covers")
          .upload(fileName, coverFile);

      if (uploadError) {
        setMessage(
          "Cover upload failed."
        );
        return;
      }

      const { data } = supabase.storage
        .from("story-covers")
        .getPublicUrl(fileName);

      coverUrl = data.publicUrl;
    }

    const { data, error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        title,
        slug: generatedSlug,
        description,
        cover_url: coverUrl,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(
      `/author/stories/${data.id}`
    );
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

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setCoverFile(
              e.target.files?.[0] ?? null
            )
          }
          className="border p-2 rounded"
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

  
        <Button type="submit">
          Create Story
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
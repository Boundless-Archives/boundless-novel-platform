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

  <main className="max-w-4xl mx-auto p-8">

```
<div
  className="rounded-xl border p-8"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <h1 className="text-5xl font-bold">
    Create New Story
  </h1>

  <p className="mt-3 opacity-70">
    Start a new story and prepare it for publication.
  </p>

  <form
    onSubmit={handleSubmit}
    className="mt-8 flex flex-col gap-6"
  >

    <div>
      <label className="block mb-2 font-medium">
        Story Title
      </label>

      <input
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        placeholder="Enter story title"
        className="
          w-full
          border
          rounded-lg
          p-3
        "
        required
      />
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Cover Image
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setCoverFile(
            e.target.files?.[0] ?? null
          )
        }
        className="
          w-full
          border
          rounded-lg
          p-3
        "
      />
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Description
      </label>

      <textarea
        value={description}
        onChange={(e) =>
          setDescription(
            e.target.value
          )
        }
        placeholder="Describe your story..."
        rows={8}
        className="
          w-full
          border
          rounded-lg
          p-3
        "
      />
    </div>

    <div className="pt-2">
      <Button type="submit">
        Create Story
      </Button>
    </div>

  </form>

  {message && (
    <div
      className="mt-6 border rounded-lg p-4"
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      {message}
    </div>
  )}

</div>
```

  </main>
);
}
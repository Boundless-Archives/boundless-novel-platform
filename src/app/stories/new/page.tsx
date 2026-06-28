"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

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

  const [genres, setGenres] = useState<any[]>([]);
  const [tags, setTags] =useState<any[]>([]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  function toggleGenre(id: string) {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(
        selectedGenres.filter((g) => g !== id)
      );
      return;
    }

    if (selectedGenres.length >= 3) return;
  
    setSelectedGenres([
      ...selectedGenres,
      id,
    ]);
  }

  function toggleTag(id: string) {
    if (selectedTags.includes(id)) {
      setSelectedTags(
        selectedTags.filter((t) => t !== id)
      );
      return;
    }

    if (selectedTags.length >= 6) return;

    setSelectedTags([
      ...selectedTags,
      id,
    ]);
  }

  useEffect(() => {
    async function loadData() {
      const { data: genreData } = await supabase
        .from("genres")
        .select("*")
        .order("name");

      const { data: tagData } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      setGenres(genreData ?? []);
      setTags(tagData ?? []);
    }

    loadData();
  }, []);

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

    if (selectedGenres.length) {
      await supabase
        .from("story_genres")
        .insert(
          selectedGenres.map((genreId) => ({
            story_id: data.id,
            genre_id: genreId,
          }))
        );
    }

    if (selectedTags.length) {
      await supabase
        .from("story_tags")
        .insert(
          selectedTags.map((tagId) => ({
            story_id: data.id,
            tag_id: tagId,
          }))
        );
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

    <div>
      <label className="block mb-2 font-medium">
        Genres (max 3)
      </label>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <button
            type="button"
            key={genre.id}
            onClick={() => toggleGenre(genre.id)}
            className={`
              px-3
              py-2
              rounded-full
              border
              transition
              ${
                selectedGenres.includes(genre.id)
                  ? "bg-black text-white"
                  : ""
              }
            `}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <p className="text-sm opacity-60 mt-2">
        {selectedGenres.length}/3 selected
      </p>
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Tags (max 6)
      </label>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            type="button"
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`
              px-3
              py-2
              rounded-full
              border
              transition
              ${
                selectedTags.includes(tag.id)
                  ? "bg-black text-white"
                  : ""
              }
            `}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <p className="text-sm opacity-60 mt-2">
        {selectedTags.length}/6 selected
      </p>
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
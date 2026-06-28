"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditStoryPage() {
  const supabase = createClient();

  const params = useParams();
  const storyId = params.id as string;

  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("Draft");

  const [coverUrl, setCoverUrl] =
    useState<string | null>(null);

  const [coverFile, setCoverFile] =
    useState<File | null>(null);

  const [genres, setGenres] =
    useState<any[]>([]);

  const [tags, setTags] =
    useState<any[]>([]);

  const [selectedGenres, setSelectedGenres] =
    useState<string[]>([]);

  const [selectedTags, setSelectedTags] =
    useState<string[]>([]);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadStory() {
      const { data: story } = await supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single();

      if (!story) return;

      setTitle(story.title);
      setDescription(story.description ?? "");
      setStatus(story.status);
      setCoverUrl(story.cover_url);

      const { data: genreList } =
        await supabase
          .from("genres")
          .select("*")
          .order("name");

      setGenres(genreList ?? []);

      const { data: tagList } =
        await supabase
          .from("tags")
          .select("*")
          .order("name");

      setTags(tagList ?? []);

      const { data: storyGenres } =
        await supabase
          .from("story_genres")
          .select("genre_id")
          .eq("story_id", storyId);

      setSelectedGenres(
        storyGenres?.map((g) => g.genre_id) ?? []
      );

      const { data: storyTags } =
        await supabase
          .from("story_tags")
          .select("tag_id")
          .eq("story_id", storyId);

      setSelectedTags(
        storyTags?.map((t) => t.tag_id) ?? []
      );
    }

    loadStory();
  }, [storyId, supabase]);

  function toggleGenre(id: string) {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(
        selectedGenres.filter(
          (g) => g !== id
        )
      );
      return;
    }

    if (selectedGenres.length >= 3)
      return;

    setSelectedGenres([
      ...selectedGenres,
      id,
    ]);
  }

  function toggleTag(id: string) {
    if (selectedTags.includes(id)) {
      setSelectedTags(
        selectedTags.filter(
          (t) => t !== id
        )
      );
      return;
    }

    if (selectedTags.length >= 6)
      return;

    setSelectedTags([
      ...selectedTags,
      id,
    ]);
  }
 
  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

      const { data: existingStory } = await supabase
        .from("stories")
        .select("id")
        .eq("title", title)
        .neq("id", storyId)
        .maybeSingle();

      if (existingStory) {
        setMessage(
          "Another story already has this title."
        );
        return;
      }

    let newCoverUrl = coverUrl;

    // Upload new cover if one was selected
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
          "Failed to upload new cover."
        );
        return;
      }

      const { data } = supabase.storage
        .from("story-covers")
        .getPublicUrl(fileName);

      newCoverUrl = data.publicUrl;
      setCoverUrl(newCoverUrl);
    }

    // Update story
    const { error } = await supabase
      .from("stories")
      .update({
        title,
        description,
        status,
        cover_url: newCoverUrl,
      })
      .eq("id", storyId);

    if (error) {
      if (error.code === "23505") {
        setMessage(
          "Another story already uses this title. Please choose a different title."
        );
      } else {
        setMessage(error.message);
      }

      return;
    }

    // Remove old genres
    await supabase
      .from("story_genres")
      .delete()
      .eq("story_id", storyId);

    // Add new genres
    if (selectedGenres.length) {
      await supabase
        .from("story_genres")
        .insert(
          selectedGenres.map((genreId) => ({
            story_id: storyId,
            genre_id: genreId,
          }))
        );
    }

    // Remove old tags
    await supabase
      .from("story_tags")
      .delete()
      .eq("story_id", storyId);

    // Add new tags
    if (selectedTags.length) {
      await supabase
        .from("story_tags")
        .insert(
          selectedTags.map((tagId) => ({
            story_id: storyId,
            tag_id: tagId,
          }))
        );
    }

    router.push(`/stories/${storyId}`);
    router.refresh();
  }

  return (
     <main className="max-w-4xl mx-auto p-8">

      <div
        className="rounded-xl border p-8"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >

        <h1 className="text-5xl font-bold">
          Edit Story
        </h1>

        <p className="mt-3 opacity-70">
          Update your story information, cover,
          genres, tags and publication status.
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
              Cover Image
            </label>

            {coverUrl && (
              <img
                src={coverUrl}
                alt="Current cover"
                className="
                  w-48
                  rounded-lg
                  mb-4
                "
              />
            )}

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
                  key={genre.id}
                  type="button"
                  onClick={() =>
                    toggleGenre(genre.id)
                  }
                  className={`
                    px-3
                    py-2
                    rounded-full
                    border
                    transition
                    ${
                      selectedGenres.includes(
                        genre.id
                      )
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
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    toggleTag(tag.id)
                  }
                  className={`
                    px-3
                    py-2
                    rounded-full
                    border
                    transition
                    ${
                      selectedTags.includes(
                        tag.id
                      )
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

          <div>
            <label className="block mb-2 font-medium">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="
                w-full
                border
                rounded-lg
                p-3
              "
            >
              <option>Draft</option>
              <option>Ongoing</option>
              <option>Completed</option>
              <option>Hiatus</option>
              <option>Dropped</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">

            <Button type="submit">
              Save Changes
            </Button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/stories/${storyId}`
                )
              }
              className="
                border
                rounded-lg
                px-4
                py-2
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              Cancel
            </button>

          </div>

        </form>

        {message && (
          <div
            className="
              mt-6
              border
              rounded-lg
              p-4
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            {message}
          </div>
        )}

      </div>

    </main>
  );
}


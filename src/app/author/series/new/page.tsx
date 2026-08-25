"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function NewSeriesPage() {
const router = useRouter();
const supabase = createClient();

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [coverFile, setCoverFile] =
useState<File | null>(null);

const [message, setMessage] = useState("");
const [saving, setSaving] = useState(false);

async function handleSubmit(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();

setMessage("");

const trimmedTitle = title.trim();

if (!trimmedTitle) {
  setMessage("Please enter a series title.");
  return;
}

setSaving(true);

try {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/auth/login");
    return;
  }

  let coverUrl: string | null = null;

  if (coverFile) {
    const extension =
      coverFile.name.split(".").pop() || "jpg";

    const filePath = `${user.id}/series-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("Series-covers")
        .upload(filePath, coverFile, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("Series-covers")
      .getPublicUrl(filePath);

    coverUrl =
      publicUrlData.publicUrl;
  }

  const { data: series, error } =
    await supabase
      .from("series")
      .insert({
        author_id: user.id,
        title: trimmedTitle,
        description:
          description.trim() || null,
        cover_url: coverUrl,
      })
      .select("id")
      .single();

  if (error) {
    throw error;
  }

  router.push(
    `/author/series/${series.id}`
  );

  router.refresh();
} catch (error) {
  console.error(error);

  setMessage(
    "Something went wrong while creating the series."
  );
} finally {
  setSaving(false);
}

}

return ( <main className="max-w-3xl mx-auto p-8">

  <div className="mb-8">
    <button
      type="button"
      onClick={() =>
        router.push("/author/series")
      }
      className="
        text-sm
        opacity-70
        hover:opacity-100
        transition
      "
    >
      ← Back to Series
    </button>

    <h1 className="mt-5 text-4xl font-bold">
      Create Series
    </h1>

    <p className="mt-2 opacity-70">
      Group connected stories together in
      reading order.
    </p>
  </div>

  <form
    onSubmit={handleSubmit}
    className="
      rounded-2xl
      border
      p-8
      space-y-6
    "
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >

    <div>
      <label
        htmlFor="title"
        className="block font-medium"
      >
        Series Title
      </label>

      <input
        id="title"
        type="text"
        value={title}
        onChange={(event) =>
          setTitle(event.target.value)
        }
        placeholder="e.g. The Chronicles of..."
        className="
          mt-2
          w-full
          rounded-xl
          border
          px-4
          py-3
          outline-none
        "
        style={{
          backgroundColor:
            "var(--background)",
          borderColor:
            "var(--card-border)",
        }}
        disabled={saving}
      />
    </div>

    <div>
      <label
        htmlFor="description"
        className="block font-medium"
      >
        Description
      </label>

      <textarea
        id="description"
        value={description}
        onChange={(event) =>
          setDescription(event.target.value)
        }
        placeholder="Describe the series..."
        rows={5}
        className="
          mt-2
          w-full
          rounded-xl
          border
          px-4
          py-3
          outline-none
          resize-y
        "
        style={{
          backgroundColor:
            "var(--background)",
          borderColor:
            "var(--card-border)",
        }}
        disabled={saving}
      />
    </div>

    <div>
      <label
        htmlFor="cover"
        className="block font-medium"
      >
        Series Cover
      </label>

      <input
        id="cover"
        type="file"
        accept="image/*"
        onChange={(event) =>
          setCoverFile(
            event.target.files?.[0] ?? null
          )
        }
        className="mt-2 block w-full text-sm"
        disabled={saving}
      />

      <p className="mt-2 text-sm opacity-60">
        Optional. This cover will represent the
        series on the author dashboard and later
        on the public series page.
      </p>
    </div>

    {message && (
      <div
        className="
          rounded-xl
          border
          p-4
          text-sm
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        {message}
      </div>
    )}

    <div className="flex gap-3">

      <button
        type="button"
        onClick={() =>
          router.push("/author/series")
        }
        disabled={saving}
        className="
          rounded-xl
          border
          px-5
          py-3
          transition
          hover:-translate-y-0.5
          hover:shadow-md
          disabled:opacity-50
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="
          rounded-xl
          border
          px-5
          py-3
          font-medium
          transition
          hover:-translate-y-0.5
          hover:shadow-md
          disabled:opacity-50
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        {saving
          ? "Creating..."
          : "Create Series"}
      </button>

    </div>

  </form>

</main>


);
}

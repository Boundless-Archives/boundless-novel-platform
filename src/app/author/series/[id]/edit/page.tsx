"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function EditSeriesPage() {
  const params = useParams();
  const router = useRouter();

  const seriesId = params.id as string;

  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [currentCoverUrl, setCurrentCoverUrl] =
    useState<string | null>(null);

  const [coverFile, setCoverFile] =
    useState<File | null>(null);

  const [removeCover, setRemoveCover] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSeries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: series, error } = await supabase
        .from("series")
        .select("*")
        .eq("id", seriesId)
        .single();

      if (error || !series) {
        router.push("/series");
        return;
      }

      if (series.author_id !== user.id) {
        router.push("/series");
        return;
      }

      setTitle(series.title);
      setDescription(series.description ?? "");
      setCurrentCoverUrl(series.cover_url ?? null);

      setLoading(false);
    }

    loadSeries();
  }, [seriesId]);

async function handleSave() {
  setMessage("");

  if (!title.trim()) {
    setMessage("Series title is required.");
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

    const { data: series, error: seriesError } =
      await supabase
        .from("series")
        .select("*")
        .eq("id", seriesId)
        .single();

    if (seriesError || !series) {
      setMessage("Series could not be found.");
      return;
    }

    if (series.author_id !== user.id) {
      setMessage(
        "You do not have permission to edit this series."
      );
      return;
    }

    const oldCoverUrl = series.cover_url;
    let newCoverUrl = oldCoverUrl;

    /*
     * --------------------------------------------------
     * REMOVE COVER ONLY
     * --------------------------------------------------
     */
    if (removeCover && oldCoverUrl) {
      newCoverUrl = null;
    }

    /*
     * --------------------------------------------------
     * UPLOAD NEW COVER
     * --------------------------------------------------
     */
    if (coverFile) {
      const fileExtension =
        coverFile.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/${seriesId}-${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("Series-covers")
          .upload(filePath, coverFile, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        setMessage(
          `Cover upload failed: ${uploadError.message}`
        );
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("Series-covers")
        .getPublicUrl(filePath);

      newCoverUrl = publicUrl;
    }

    /*
     * --------------------------------------------------
     * UPDATE SERIES RECORD FIRST
     * --------------------------------------------------
     */
    const { error: updateError } =
      await supabase
        .from("series")
        .update({
          title: title.trim(),
          description:
            description.trim() || null,
          cover_url: newCoverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seriesId);

    if (updateError) {
      setMessage(
        `Failed to save changes: ${updateError.message}`
      );
      return;
    }

    /*
     * --------------------------------------------------
     * DATABASE UPDATE SUCCEEDED.
     * NOW IT IS SAFE TO REMOVE THE OLD COVER.
     * --------------------------------------------------
     */
    if (
      oldCoverUrl &&
      newCoverUrl !== oldCoverUrl
    ) {
      const marker =
        "/storage/v1/object/public/Series-covers/";

      const index =
        oldCoverUrl.indexOf(marker);

      if (index !== -1) {
        const oldPath =
          oldCoverUrl.substring(
            index + marker.length
          );

        const { error: removeError } =
          await supabase.storage
            .from("Series-covers")
            .remove([oldPath]);

        if (removeError) {
          console.error(
            "Old cover cleanup failed:",
            removeError
          );
        }
      }
    }

    router.push(`/author/series/${seriesId}`);
    router.refresh();
  } catch (error) {
    console.error(error);

    setMessage(
      "Something went wrong while saving the series."
    );
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <p className="opacity-70">
          Loading series...
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            router.push(`/author/series/${seriesId}`)
          }
          className="text-sm opacity-70 hover:opacity-100 transition"
        >
          ← Back to Series
        </button>

        <h1 className="mt-5 text-4xl font-bold">
          Edit Series
        </h1>

        <p className="mt-2 opacity-70">
          Update your series details and cover.
        </p>
      </div>

      <div
        className="rounded-2xl border p-8"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Series Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="
                w-full
                rounded-lg
                border
                px-4
                py-3
                bg-transparent
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={6}
              className="
                w-full
                rounded-lg
                border
                px-4
                py-3
                bg-transparent
                resize-y
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Series Cover
            </label>

            {currentCoverUrl && !removeCover && (
              <div className="mb-4">
                <img
                  src={currentCoverUrl}
                  alt={title}
                  className="
                    w-48
                    h-72
                    object-cover
                    rounded-xl
                    border
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ?? null;

                setCoverFile(file);

                if (file) {
                  setRemoveCover(false);
                }
              }}
            />

            {currentCoverUrl && (
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removeCover}
                  onChange={(event) => {
                    setRemoveCover(
                      event.target.checked
                    );

                    if (event.target.checked) {
                      setCoverFile(null);
                    }
                  }}
                />

                Remove current cover
              </label>
            )}
          </div>

          {message && (
            <div
              className="
                rounded-lg
                border
                px-4
                py-3
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

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                router.push(`/series/${seriesId}`)
              }
              className="
                border
                rounded-lg
                px-5
                py-3
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="
                rounded-lg
                border
                px-5
                py-3
                font-medium
                transition
                hover:-translate-y-0.5
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
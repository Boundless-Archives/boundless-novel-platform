"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Button from "@/components/ui/Button";
import ShelfSelect from "@/components/library/ShelfSelect";
import { isShelf, type Shelf } from "@/lib/shelves";

type Props = {
  storyId: string;
};

export default function SaveStoryButton({
  storyId,
}: Props) {
  const supabase = createClient();

  const [saved, setSaved] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [shelf, setShelf] =
    useState<Shelf>("want_to_read");

  useEffect(() => {
    async function checkSaved() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("library")
        .select("id, shelf")
        .eq("user_id", user.id)
        .eq("story_id", storyId)
        .maybeSingle();

      setSaved(!!data);

      if (data && isShelf(data.shelf)) {
        setShelf(data.shelf);
      }
      setLoading(false);
    }

    checkSaved();
  }, [storyId, supabase]);

  async function handleSave() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(
        "Please log in to save stories."
      );
      return;
    }

    const { error } = await supabase
      .from("library")
      .insert({
        user_id: user.id,
        story_id: storyId,
      });

    if (!error) {
      const { data } = await supabase
        .from("library")
        .select("shelf")
        .eq("user_id", user.id)
        .eq("story_id", storyId)
        .maybeSingle();

      if (data && isShelf(data.shelf)) {
        setShelf(data.shelf);
      }

      setSaved(true);
    }
  }

  async function handleRemove() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("library")
      .delete()
      .eq("user_id", user.id)
      .eq("story_id", storyId);

    if (!error) {
      setSaved(false);
    }
  }

  if (loading) {
    return (
      <p className="mt-4">
        Loading...
      </p>
    );
  }

  return (
    <div className="mt-4">
      {saved ? (
        <div className="flex flex-wrap items-center gap-3">
          <ShelfSelect
            key={shelf}
            storyId={storyId}
            initial={shelf}
          />

          <Button
            type="button"
            onClick={handleRemove}
          >
            Remove from Library
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleSave}
        >
          Save Story
        </Button>
      )}
    </div>
  );
}
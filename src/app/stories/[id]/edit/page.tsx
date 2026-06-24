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

    router.push(
      `/stories/${storyId}`
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
    Edit Story
  </h1>

  <p className="mt-3 opacity-70">
    Update your story information and publication status.
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
        Status
      </label>

      <select
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value
          )
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
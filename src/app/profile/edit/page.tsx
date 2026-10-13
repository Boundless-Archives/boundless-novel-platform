"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  cleanUsernameInput,
  USERNAME_PATTERN,
  USERNAME_RULES_TEXT,
  validateUsername,
} from "@/lib/username";

export default function EditProfilePage() {
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  // Usernames are set once. The only people who can still edit
  // theirs are those who haven't picked one yet, or whose old
  // username breaks the rules (e.g. contains a space).
  const [usernameLocked, setUsernameLocked] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) return;

      const current: string = data.username ?? "";

      setUsername(current);
      setSavedUsername(current);
      setUsernameLocked(
        Boolean(data.onboarding_completed) &&
          USERNAME_PATTERN.test(current)
      );
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
    }

    loadProfile();
  }, [supabase]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) return;

    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in.");
      return;
    }

    const changingUsername =
      !usernameLocked && username !== savedUsername;

    if (changingUsername) {
      const problem = validateUsername(username);

      if (problem) {
        setMessage(problem);
        return;
      }

      const { data: available } = await supabase.rpc(
        "is_username_available",
        { candidate: username }
      );

      if (!available) {
        setMessage("That username is already taken.");
        return;
      }
    }

    // A username that breaks the rules has to be fixed before
    // anything else can be saved, so the profile link works.
    if (!usernameLocked && !changingUsername) {
      const problem = validateUsername(username);

      if (problem) {
        setMessage(problem);
        return;
      }
    }

    setSaving(true);

    let avatarUrl: string | undefined;

    if (avatarFile) {
      const fileExt =
        avatarFile.name.split(".").pop();

      const fileName =
        `${user.id}.${fileExt}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(
            fileName,
            avatarFile,
            {
              upsert: true,
            }
          );

      if (uploadError) {
        setMessage(uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

      avatarUrl =
        publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        ...(changingUsername && {
          username,
          onboarding_completed: true,
        }),
        display_name: displayName,
        bio,
        ...(avatarUrl && {
          avatar_url: avatarUrl,
        }),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setMessage(
        error.code === "23505"
          ? "That username is already taken."
          : error.message
      );
      return;
    }

    if (changingUsername) {
      setSavedUsername(username);
      setUsernameLocked(true);
    }

    setMessage("Profile updated successfully.");
  }

  return (
    <main className="p-10 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">
        Edit Profile
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div>
          <input
            value={username}
            onChange={(e) =>
              setUsername(cleanUsernameInput(e.target.value))
            }
            placeholder="Username"
            maxLength={20}
            readOnly={usernameLocked}
            disabled={usernameLocked}
            autoComplete="off"
            className="border p-2 rounded w-full disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-1 text-xs opacity-60">
            {usernameLocked
              ? "Your username is set and can't be changed."
              : `${USERNAME_RULES_TEXT} You can only choose this once.`}
          </p>
        </div>

        <input
          value={displayName}
          onChange={(e) =>
            setDisplayName(e.target.value)
          }
          placeholder="Display Name"
          className="border p-2 rounded"
        />

        <textarea
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          placeholder="Bio"
          className="border p-2 rounded"
          rows={5}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setAvatarFile(
              e.target.files?.[0] ?? null
            )
          }
        />

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
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
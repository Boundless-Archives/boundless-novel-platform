"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return { supabase, user };
}

/*
 * Create a collection.
 */
export async function createCollection(
  formData: FormData
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const isPublic =
    formData.get("is_public") === "on";

  if (!title) {
    throw new Error(
      "Collection title is required."
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collections");

  return data;
}

/*
 * Update a collection.
 */
export async function updateCollection(
  collectionId: string,
  title: string,
  description?: string,
  isPublic: boolean = false
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error(
      "Collection title is required."
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .update({
      title: cleanTitle,
      description:
        description?.trim() || null,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collections");
  revalidatePath(
    `/collections/${collectionId}`
  );

  return data;
}

/*
 * Delete a collection.
 */
export async function deleteCollection(
  collectionId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collections");
  revalidatePath(
    `/collections/${collectionId}`
  );
}

/*
 * Add a story to a collection.
 */
export async function addStoryToCollection(
  collectionId: string,
  storyId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  /*
   * Verify that the collection belongs
   * to the current user.
   */
  const { data: collection, error: collectionError } =
    await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", user.id)
      .single();

  if (collectionError || !collection) {
    throw new Error(
      "Collection not found."
    );
  }

  /*
   * Make sure the story is actually saved
   * in the user's library.
   */
  const { data: savedStory, error: libraryError } =
    await supabase
      .from("library")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .maybeSingle();

  if (libraryError) {
    throw new Error(libraryError.message);
  }

  if (!savedStory) {
    throw new Error(
      "You can only add stories that are in your library."
    );
  }

  /*
   * Determine the next position.
   */
  const { data: lastStory } = await supabase
    .from("collection_stories")
    .select("position")
    .eq("collection_id", collectionId)
    .order("position", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const nextPosition =
    lastStory?.position != null
      ? lastStory.position + 1
      : 0;

  const { data, error } = await supabase
    .from("collection_stories")
    .insert({
      collection_id: collectionId,
      story_id: storyId,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    /*
     * The unique constraint prevents
     * duplicate stories in a collection.
     */
    if (error.code === "23505") {
      throw new Error(
        "This story is already in the collection."
      );
    }

    throw new Error(error.message);
  }

  revalidatePath("/collections");
  revalidatePath(
    `/collections/${collectionId}`
  );

  return data;
}

/*
 * Remove a story from a collection.
 */
export async function removeStoryFromCollection(
  collectionId: string,
  storyId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  /*
   * RLS protects this operation, but we
   * also explicitly scope it to the user's
   * collection.
   */
  const { data: collection, error: collectionError } =
    await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", user.id)
      .single();

  if (collectionError || !collection) {
    throw new Error(
      "Collection not found."
    );
  }

  const { error } = await supabase
    .from("collection_stories")
    .delete()
    .eq("collection_id", collectionId)
    .eq("story_id", storyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collections");
  revalidatePath(
    `/collections/${collectionId}`
  );
}

/*
 * Reorder stories inside a collection.
 */
export async function reorderCollectionStories(
  collectionId: string,
  storyIds: string[]
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  /*
   * Verify ownership.
   */
  const { data: collection, error: collectionError } =
    await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", user.id)
      .single();

  if (collectionError || !collection) {
    throw new Error(
      "Collection not found."
    );
  }

  /*
   * Update each story's position.
   */
  for (let index = 0; index < storyIds.length; index++) {
    const { error } = await supabase
      .from("collection_stories")
      .update({
        position: index,
      })
      .eq("collection_id", collectionId)
      .eq("story_id", storyIds[index]);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/collections");
  revalidatePath(
    `/collections/${collectionId}`
  );
}
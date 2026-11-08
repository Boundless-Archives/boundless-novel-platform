"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createSlug } from "@/lib/entityTypes";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/* Writer may add to their own universe, or to one they were invited to. */
async function resolveUniverseForWrite(userId: string, universeId?: string) {
  const own = await getOrCreateMyUniverse();

  if (!universeId || universeId === own.id) {
    return { universe: own, db: (await createClient()) as SupabaseClient };
  }

  const admin = createAdminClient();
  const { data: allowed } = await admin.rpc("can_edit_universe", {
    p_user: userId,
    p_universe: universeId,
  });

  if (!allowed) {
    throw new Error("You can't add entries to that universe.");
  }

  const { data: shared } = await admin
    .from("universes")
    .select("*")
    .eq("id", universeId)
    .single();

  if (!shared) throw new Error("Universe not found.");

  return { universe: shared, db: admin as SupabaseClient };
}

async function awardUniverseProgress(userId: string) {
  try {
    await createAdminClient().rpc("award_universe_progress", { p_user: userId });
  } catch (error) {
    console.error("award_universe_progress failed:", error);
  }
}

function cleanReveal(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  return n >= 1 && n <= 5000 ? n : null;
}

function cleanTimeline(label: string | undefined, order: number | null | undefined) {
  const trimmed = (label ?? "").trim().slice(0, 80);
  return {
    timeline_label: trimmed || null,
    timeline_order: order != null && Number.isFinite(order) ? order : null,
  };
}

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

/* Owner edits through RLS; a co-author may only edit entries they created. */
async function dbForEntityEdit(
  supabase: SupabaseClient,
  userId: string,
  entity: { created_by?: string; universe_id?: string } | null | undefined,
  universeInfo: { owner_id?: string } | null | undefined
): Promise<SupabaseClient> {
  if (entity && universeInfo?.owner_id === userId) return supabase;

  if (entity && entity.created_by === userId && entity.universe_id) {
    const admin = createAdminClient();
    const { data: allowed } = await admin.rpc("can_edit_universe", {
      p_user: userId,
      p_universe: entity.universe_id,
    });
    if (allowed) return admin as SupabaseClient;
  }

  throw new Error("You can only edit entries you own or created.");
}

/*
 * Get the current user's personal Telos universe,
 * creating it on first use.
 */
export async function getOrCreateMyUniverse() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: existing } = await supabase
    .from("universes")
    .select("*")
    .eq("owner_id", user.id)
    .eq("multiverse", "telos")
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const baseName = `${
    profile?.display_name || profile?.username || "Writer"
  }'s Universe`;

  let slug = createSlug(baseName);

  const { data: slugTaken } = await supabase
    .from("universes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugTaken) {
    slug = `${slug}-${user.id.slice(0, 6)}`;
  }

  const { data: created, error } = await supabase
    .from("universes")
    .insert({
      owner_id: user.id,
      multiverse: "telos",
      name: baseName,
      slug,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return created;
}

/*
 * Rename / redescribe the current user's universe.
 */
export async function updateMyUniverse(
  universeId: string,
  name: string,
  description: string,
  bannerUrl?: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  if (!name.trim()) {
    throw new Error("Universe name is required.");
  }

  const updatePayload: Record<string, unknown> = {
    name,
    description: description || null,
    updated_at: new Date().toISOString(),
  };

  if (bannerUrl !== undefined) {
    updatePayload.banner_url = bannerUrl;
  }

  const { error } = await supabase
    .from("universes")
    .update(updatePayload)
    .eq("id", universeId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/my-universe");
  revalidatePath(`/wiki/${user.id}`); // harmless no-op if slug differs
}

/*
 * Get the stories the current user can pick as
 * an entity's origin / appearances (their own stories).
 */
export async function getMyStoriesForWiki() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("stories")
    .select("id, title, canon_tier")
    .eq("author_id", user.id)
    .order("title");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/*
 * Create a new wiki entity.
 */
export async function createEntity(input: {
  entityType: string;
  name: string;
  summary: string;
  content: string;
  imageUrl: string | null;
  originStoryId: string;
  appearanceStoryIds: string[];
  universeId?: string;
  revealChapter?: number | null;
  timelineLabel?: string;
  timelineOrder?: number | null;
}) {
  const { supabase, user } =
    await getAuthenticatedUser();

  if (!input.name.trim() || !input.originStoryId) {
    throw new Error(
      "Name and origin story are required."
    );
  }

  const { universe, db } = await resolveUniverseForWrite(
    user.id,
    input.universeId
  );

  const { data: originStory } = await supabase
    .from("stories")
    .select("id, author_id")
    .eq("id", input.originStoryId)
    .maybeSingle();

  if (!originStory || originStory.author_id !== user.id) {
    throw new Error(
      "Origin story must be one of your own stories."
    );
  }

  let slug = createSlug(input.name);

  const { data: slugTaken } = await db
    .from("entities")
    .select("id")
    .eq("universe_id", universe.id)
    .eq("slug", slug)
    .maybeSingle();

  if (slugTaken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { data: entity, error } = await db
    .from("entities")
    .insert({
      reveal_chapter: cleanReveal(input.revealChapter),
      ...cleanTimeline(input.timelineLabel, input.timelineOrder),
      universe_id: universe.id,
      origin_story_id: input.originStoryId,
      entity_type: input.entityType,
      name: input.name,
      slug,
      summary: input.summary || null,
      content: input.content || null,
      image_url: input.imageUrl,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const appearanceIds = Array.from(
    new Set([
      input.originStoryId,
      ...input.appearanceStoryIds,
    ])
  );

  const { error: appearanceError } = await db
    .from("entity_appearances")
    .insert(
      appearanceIds.map((storyId) => ({
        entity_id: entity.id,
        story_id: storyId,
      }))
    );

  if (appearanceError) {
    throw new Error(appearanceError.message);
  }

  revalidatePath("/my-universe");
  revalidatePath(`/wiki/${universe.slug}`);

  const { checkAndAwardBadges } = await import("@/app/badges/actions");
  await checkAndAwardBadges(user.id);
  await awardUniverseProgress(user.id);

  return { entityId: entity.id, universeSlug: universe.slug };
}

/*
 * Update an existing entity (name/summary/content/type
 * stay editable; origin story does not change once set).
 */
export async function updateEntity(
  entityId: string,
  input: {
    entityType: string;
    name: string;
    summary: string;
    content: string;
    imageUrl: string | null;
    appearanceStoryIds: string[];
    revealChapter?: number | null;
    timelineLabel?: string;
    timelineOrder?: number | null;
  }
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: entity } = await supabase
    .from("entities")
    .select(
      "id, universe_id, origin_story_id, created_by, universes!inner(owner_id, slug)"
    )
    .eq("id", entityId)
    .maybeSingle();

  const universeInfo = Array.isArray(entity?.universes)
    ? entity?.universes[0]
    : entity?.universes;

  const db = await dbForEntityEdit(supabase, user.id, entity, universeInfo);
  if (!entity) throw new Error("Entry not found.");

  const { error } = await db
    .from("entities")
    .update({
      reveal_chapter: cleanReveal(input.revealChapter),
      ...cleanTimeline(input.timelineLabel, input.timelineOrder),
      entity_type: input.entityType,
      name: input.name,
      summary: input.summary || null,
      content: input.content || null,
      image_url: input.imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entityId);

  if (error) {
    throw new Error(error.message);
  }

  const appearanceIds = Array.from(
    new Set([
      entity.origin_story_id,
      ...input.appearanceStoryIds,
    ])
  );

  await db
    .from("entity_appearances")
    .delete()
    .eq("entity_id", entityId);

  const { error: appearanceError } = await db
    .from("entity_appearances")
    .insert(
      appearanceIds.map((storyId) => ({
        entity_id: entityId,
        story_id: storyId,
      }))
    );

  if (appearanceError) {
    throw new Error(appearanceError.message);
  }

  revalidatePath("/my-universe");
  revalidatePath(`/wiki/${universeInfo?.slug}`);
}

/*
 * Get a single entity for editing, with its
 * current appearance story ids. Ownership-checked.
 */
export async function getEntityForEdit(entityId: string) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: entity, error } = await supabase
    .from("entities")
    .select(
      `
      id,
      name,
      entity_type,
      summary,
      content,
      image_url,
      origin_story_id,
      created_by,
      reveal_chapter,
      timeline_label,
      timeline_order,
      universes!inner ( owner_id, slug ),
      entity_appearances ( story_id )
    `
    )
    .eq("id", entityId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const universeInfo = Array.isArray(entity?.universes)
    ? entity?.universes[0]
    : entity?.universes;

  await dbForEntityEdit(supabase, user.id, entity, universeInfo);
  if (!entity) throw new Error("Entry not found.");

  return {
    id: entity.id,
    name: entity.name,
    entityType: entity.entity_type,
    summary: entity.summary ?? "",
    content: entity.content ?? "",
    imageUrl: entity.image_url as string | null,
    originStoryId: entity.origin_story_id,
    universeSlug: universeInfo?.slug as string,
    revealChapter: (entity.reveal_chapter as number | null) ?? null,
    timelineLabel: (entity.timeline_label as string | null) ?? "",
    timelineOrder: (entity.timeline_order as number | null) ?? null,
    appearanceStoryIds: (entity.entity_appearances ?? []).map(
      (appearance: any) => appearance.story_id
    ),
  };
}

/*
 * Get every other entity in the same universe as
 * the given entity — for the "link to" picker.
 */
export async function getOtherEntitiesInUniverse(
  entityId: string
) {
  const supabase = await createClient();

  const { data: entity } = await supabase
    .from("entities")
    .select("universe_id")
    .eq("id", entityId)
    .maybeSingle();

  if (!entity) {
    return [];
  }

  const { data, error } = await supabase
    .from("entities")
    .select("id, name, entity_type")
    .eq("universe_id", entity.universe_id)
    .neq("id", entityId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/*
 * Get outgoing + incoming relationships for an entity.
 */
export async function getRelationshipsForEntity(
  entityId: string
) {
  const supabase = await createClient();

  const { data: outgoing } = await supabase
    .from("entity_relationships")
    .select(
      `
      id,
      relationship_type,
      to_entity:to_entity_id ( id, name, slug, entity_type )
    `
    )
    .eq("from_entity_id", entityId);

  const { data: incoming } = await supabase
    .from("entity_relationships")
    .select(
      `
      id,
      relationship_type,
      from_entity:from_entity_id ( id, name, slug, entity_type )
    `
    )
    .eq("to_entity_id", entityId);

  return {
    outgoing: outgoing ?? [],
    incoming: incoming ?? [],
  };
}

/*
 * Add a relationship from one entity to another.
 * Only the universe owner can do this.
 */
export async function addRelationship(
  fromEntityId: string,
  toEntityId: string,
  relationshipType: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  if (!relationshipType.trim()) {
    throw new Error("Relationship type is required.");
  }

  const { data: fromEntity } = await supabase
    .from("entities")
    .select(
      "id, universe_id, universes!inner(owner_id, slug)"
    )
    .eq("id", fromEntityId)
    .maybeSingle();

  const universeInfo = Array.isArray(fromEntity?.universes)
    ? fromEntity?.universes[0]
    : fromEntity?.universes;

  if (!fromEntity || universeInfo?.owner_id !== user.id) {
    throw new Error(
      "You can only add relationships in your own universe."
    );
  }

  const { data: toEntity } = await supabase
    .from("entities")
    .select("id, universe_id")
    .eq("id", toEntityId)
    .maybeSingle();

  if (
    !toEntity ||
    toEntity.universe_id !== fromEntity.universe_id
  ) {
    throw new Error(
      "Both entities must be in the same universe."
    );
  }

  const { error } = await supabase
    .from("entity_relationships")
    .insert({
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      relationship_type: relationshipType,
      created_by: user.id,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/wiki/${universeInfo?.slug}`);
  await awardUniverseProgress(user.id);
}

/*
 * Remove a relationship (universe owner only).
 */
export async function deleteRelationship(
  relationshipId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: relationship } = await supabase
    .from("entity_relationships")
    .select(
      `
      id,
      from_entity:from_entity_id (
        universes!inner ( owner_id, slug )
      )
    `
    )
    .eq("id", relationshipId)
    .maybeSingle();

  const fromEntity = Array.isArray(relationship?.from_entity)
    ? relationship?.from_entity[0]
    : relationship?.from_entity;

  const universeInfo = Array.isArray(fromEntity?.universes)
    ? fromEntity?.universes[0]
    : fromEntity?.universes;

  if (!relationship || universeInfo?.owner_id !== user.id) {
    throw new Error(
      "You can only remove relationships in your own universe."
    );
  }

  const { error } = await supabase
    .from("entity_relationships")
    .delete()
    .eq("id", relationshipId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/wiki/${universeInfo?.slug}`);
}

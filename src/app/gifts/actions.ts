"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireFeature } from "@/lib/platform";

export async function getGiftCatalog() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gifts")
    .select("id, slug, name, description, icon, price")
    .eq("is_active", true)
    .order("sort_order");

  return data ?? [];
}

export async function getMyBalance() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.balance as number) ?? 0;
}

export async function sendGift(giftId: string, storyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  await requireFeature("gifts", user.id);

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("send_gift", {
      p_sender_id: user.id,
      p_gift_id: giftId,
      p_story_id: storyId,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const result = data as {
    new_sender_balance: number;
    recipient_id: string;
    gift_name: string;
    story_title: string;
    story_slug: string;
  };

  const { data: sender } = await adminClient
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const senderName =
    sender?.display_name ?? sender?.username ?? "Someone";

  const { error: notifyError } = await adminClient
    .from("notifications")
    .insert({
      user_id: result.recipient_id,
      actor_id: user.id,
      type: "gift_received",
      title: "You received a gift!",
      message: `${senderName} sent you ${result.gift_name} on "${result.story_title}".`,
      link: `/story/${result.story_slug}`,
    });

  if (notifyError) {
    console.error("Gift notification failed:", notifyError.message);
  }

  revalidatePath(`/story/${result.story_slug}`);

  return {
    newBalance: result.new_sender_balance,
    giftName: result.gift_name,
  };
}

export async function getStorySupporters(storyId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gift_transactions")
    .select(
      "price_paid, sender_id, sender:sender_id ( username, display_name )"
    )
    .eq("story_id", storyId);

  const totals = new Map<
    string,
    {
      senderId: string;
      username: string;
      displayName: string | null;
      total: number;
    }
  >();

  let totalEmbers = 0;

  for (const row of (data ?? []) as any[]) {
    const sender = Array.isArray(row.sender)
      ? row.sender[0]
      : row.sender;

    totalEmbers += row.price_paid;

    const existing = totals.get(row.sender_id);

    if (existing) {
      existing.total += row.price_paid;
    } else {
      totals.set(row.sender_id, {
        senderId: row.sender_id,
        username: sender?.username ?? "unknown",
        displayName: sender?.display_name ?? null,
        total: row.price_paid,
      });
    }
  }

  const top = Array.from(totals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    top,
    totalGifts: data?.length ?? 0,
    totalEmbers,
  };
}
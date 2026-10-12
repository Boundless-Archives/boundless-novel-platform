import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  CURRENCY_NAME,
  OFFERWALL_MAX_POINTS_PER_CONVERSION,
} from "@/lib/currency";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function signatureMatches(
  rawBody: string,
  received: string,
  key: string
) {
  const expected = createHmac("sha256", key)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(received.trim().toLowerCase());

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const key = process.env.ADGEM_POSTBACK_KEY;

  if (!key) {
    console.error("ADGEM_POSTBACK_KEY is not set");
    return NextResponse.json(
      { error: "Not configured" },
      { status: 500 }
    );
  }

  // Optional: only enforced once AdGem support gives you their
  // static postback IP and you set ADGEM_WHITELIST_IP.
  const whitelistIp = process.env.ADGEM_WHITELIST_IP;

  if (whitelistIp) {
    const forwarded = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0].trim();

    if (ip !== whitelistIp) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  // The signature covers the exact raw body, so read it as text
  // before parsing anything.
  const rawBody = await request.text();
  const signature = request.headers.get("signature") ?? "";

  if (!signature || !signatureMatches(rawBody, signature, key)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Bad request" },
      { status: 400 }
    );
  }

  const data = payload?.data ?? {};

  const userId = String(data.player_id ?? "").toLowerCase();
  const conversionId = String(data.conversion_id ?? "");
  const goalId = String(data.goal_id ?? "");
  const conversionType = String(data.conversion_type ?? "reward");
  const offerName = data.offer_name ? String(data.offer_name) : null;
  const points = Math.floor(Number(data.amount));
  const usdValue = Number(data.payout);

  if (!UUID_PATTERN.test(userId) || !conversionId) {
    return NextResponse.json(
      { error: "Bad request" },
      { status: 400 }
    );
  }

  // Install-tracking events and zero-value events reward nothing.
  if (
    conversionType !== "reward" ||
    !Number.isFinite(points) ||
    points < 1
  ) {
    return NextResponse.json({
      status: "ignored",
      reason: "nothing to credit",
    });
  }

  if (points > OFFERWALL_MAX_POINTS_PER_CONVERSION) {
    // Respond 200 so AdGem stops retrying, but don't credit.
    // An unusually large value needs a human to look at it.
    console.error("Offerwall conversion flagged for review:", {
      conversionId,
      userId,
      points,
    });

    return NextResponse.json({
      status: "flagged",
      reason: "amount above limit",
    });
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({
      status: "ignored",
      reason: "unknown user",
    });
  }

  const { data: result, error } = await adminClient.rpc(
    "process_offerwall_conversion",
    {
      p_provider: "adgem",
      p_conversion_key: goalId
        ? `${conversionId}:${goalId}`
        : conversionId,
      p_user_id: userId,
      p_points: points,
      p_usd: Number.isFinite(usdValue) ? usdValue : null,
      p_offer_name: offerName,
    }
  );

  if (error) {
    console.error("Offerwall postback failed:", {
      conversionId,
      message: error.message,
    });

    // AdGem retries on any non-2xx (3 attempts, a few seconds
    // apart). Safe to retry: processing is idempotent.
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }

  if (result === "credited") {
    const { error: notifyError } = await adminClient
      .from("notifications")
      .insert({
        user_id: userId,
        type: "system",
        title: "Offer reward credited",
        message: `You earned ${points.toLocaleString()} ${CURRENCY_NAME}${
          offerName ? ` from "${offerName}"` : ""
        }.`,
        link: "/wallet",
      });

    if (notifyError) {
      console.error(
        "Offerwall notification failed:",
        notifyError.message
      );
    }
  }

  return NextResponse.json({ status: result });
}
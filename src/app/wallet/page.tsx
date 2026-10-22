import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getWalletSummary,
  getAdEarningStatus,
} from "@/app/wallet/actions";
// import AdEarnButton from "@/components/wallet/AdEarnButton";
import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import {
  CURRENCY_NAME,
  SPARK_NAME,
  formatCoins,
} from "@/lib/currency";
import OfferwallSection from "@/components/wallet/OfferwallSection";

const TRANSACTION_LABELS: Record<string, string> = {
  ad_reward: "Watched an ad",
  streak_reward: "Streak reward",
  gift_sent: "Gift sent",
  gift_received: "Gift received",
  purchase: "Purchased",
  admin_adjust: "Adjustment",
  cultivation_spend: "Cultivation",
  offerwall_reward: "Offer completed",
  spark_exchange: "Exchanged for Sparks",
  shop_purchase: "Shop purchase",
  other: "Other",
};

const SPARK_TRANSACTION_LABELS: Record<string, string> = {
  streak_reward: "Streak reward",
  leaderboard: "Leaderboard prize",
  shop_purchase: "Shop purchase",
  ember_exchange: "Exchanged Embers",
  conversion: "Converted from bonus Embers",
  admin_adjust: "Adjustment",
};

type ActivityRow = {
  id: string;
  type: string;
  description: string | null;
  amount: number;
};

export default async function WalletPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [wallet, adStatus] = await Promise.all([
    getWalletSummary(),
    getAdEarningStatus(),
  ]);

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-4xl font-bold">
        Your {CURRENCY_NAME}
      </h1>

      <div
        className="mt-6 rounded-2xl border p-8 text-center"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <p className="text-sm uppercase tracking-wide opacity-60">
          Balance
        </p>

        <p
          className="mt-2 flex items-center justify-center gap-3 text-5xl font-bold font-serif"
          style={{ color: "var(--accent)" }}
        >
          <Flame size={40} />
          {formatCoins(wallet.balance)}
        </p>

        <p className="mt-3 text-sm opacity-50">
          {wallet.lifetimeEarned.toLocaleString()} earned all-time
        </p>
      </div>

      <div
        className="mt-4 rounded-2xl border p-6"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-60">
              {SPARK_NAME}
            </p>

            <p
              className="mt-1 flex items-center gap-2 text-3xl font-bold font-serif"
              style={{ color: "var(--accent)" }}
            >
              <Zap size={28} />
              {formatCoins(wallet.sparkBalance)}
            </p>
          </div>

          <Link
            href="/shop"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Open the Spark Shop
          </Link>
        </div>

        <p className="mt-3 text-xs opacity-60">
          {SPARK_NAME} are free: you earn them from streak
          milestones. They stay in the app. They can&apos;t be
          gifted or withdrawn, but they can be used in the shop.
        </p>

        <p className="mt-2 text-xs opacity-80">
          Want more?{" "}
          <Link href="/refer" className="underline">
            Refer a friend
          </Link>{" "}
          and earn {SPARK_NAME} when they join and publish.
        </p>
      </div>

      {/* <div className="mt-6">
        <AdEarnButton initialStatus={adStatus} />
      </div> */}

      <OfferwallSection userId={user.id} />

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Recent Activity
        </h2>

        {wallet.transactions.length === 0 ? (
          <p className="opacity-60 text-sm">
            No activity yet — watch an ad to earn your first{" "}
            {CURRENCY_NAME}.
          </p>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((tx: ActivityRow) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderColor: "var(--card-border)" }}
              >
                <div>
                  <p className="font-medium">
                    {TRANSACTION_LABELS[tx.type] ?? tx.type}
                  </p>

                  {tx.description && (
                    <p className="opacity-50 text-xs mt-0.5">
                      {tx.description}
                    </p>
                  )}
                </div>

                <span
                  className="font-semibold"
                  style={{
                    color:
                      tx.amount >= 0
                        ? "var(--accent)"
                        : "inherit",
                  }}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

        {wallet.sparkTransactions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">
            Recent {SPARK_NAME} Activity
          </h2>

          <div className="space-y-2">
            {wallet.sparkTransactions.map((tx: ActivityRow) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderColor: "var(--card-border)" }}
              >
                <div>
                  <p className="font-medium">
                    {SPARK_TRANSACTION_LABELS[tx.type] ?? tx.type}
                  </p>

                  {tx.description && (
                    <p className="opacity-50 text-xs mt-0.5">
                      {tx.description}
                    </p>
                  )}
                </div>

                <span
                  className="font-semibold"
                  style={{
                    color:
                      tx.amount >= 0
                        ? "var(--accent)"
                        : "inherit",
                  }}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
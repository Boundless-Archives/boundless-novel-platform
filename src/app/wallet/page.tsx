import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getWalletSummary,
  getAdEarningStatus,
} from "@/app/wallet/actions";
// import AdEarnButton from "@/components/wallet/AdEarnButton";
import { Flame } from "lucide-react";
import { CURRENCY_NAME, formatCoins } from "@/lib/currency";
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
  other: "Other",
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

        {wallet.bonusBalance > 0 && (
          <p className="mt-4 text-xs opacity-60">
            {formatCoins(wallet.bonusBalance)} of these are bonus{" "}
            {CURRENCY_NAME} (from streaks and rewards). You can gift
            and spend them, but they can&apos;t be withdrawn.
          </p>
        )}
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
            {wallet.transactions.map((tx: any) => (
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
    </main>
  );
}
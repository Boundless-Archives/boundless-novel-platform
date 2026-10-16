import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getShopData } from "@/app/shop/actions";
import ShopClient from "@/components/shop/ShopClient";

export const metadata = {
  title: "Spark Shop",
};

export default async function ShopPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const data = await getShopData();

  return <ShopClient {...data} />;
}
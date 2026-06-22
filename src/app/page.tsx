import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("_test_connection")
    .select("*")
    .limit(1);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">
        Boundless Novel Platform
      </h1>

      <p className="mt-4">
        Supabase connection test
      </p>

      <pre className="mt-4">
        {JSON.stringify(
          {
            success: !error,
            error: error?.message ?? null,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
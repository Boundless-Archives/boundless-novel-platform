import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getOrCreateMyUniverse,
  updateMyUniverse,
} from "@/app/wiki/actions";
import {
  getEntityTypeIcon,
  getEntityTypeLabel,
} from "@/lib/entityTypes";

export default async function MyUniversePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const universe = await getOrCreateMyUniverse();

  const { data: entities } = await supabase
    .from("entities")
    .select("id, name, slug, entity_type, updated_at")
    .eq("universe_id", universe.id)
    .order("updated_at", { ascending: false });

  const grouped = (entities ?? []).reduce(
    (acc: Record<string, typeof entities>, entity: any) => {
      const key = entity.entity_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    },
    {}
  );

  const params = await searchParams;

  async function saveUniverse(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "");
    const description = String(
      formData.get("description") ?? ""
    );

    const bannerFile = formData.get("banner") as File | null;

    let bannerUrl: string | undefined = undefined;

    if (bannerFile && bannerFile.size > 0) {
      const supabaseServer = await createClient();
      const fileExt = bannerFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseServer.storage
        .from("universe-banners")
        .upload(fileName, bannerFile);

      if (!uploadError) {
        const { data } = supabaseServer.storage
          .from("universe-banners")
          .getPublicUrl(fileName);

        bannerUrl = data.publicUrl;
      }
    }

    await updateMyUniverse(
      universe.id,
      name,
      description,
      bannerUrl
    );

    redirect("/my-universe?saved=1");
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-4xl font-bold">
          My Universe
        </h1>

        <Link
          href={`/wiki/${universe.slug}`}
          className="text-sm underline opacity-70"
        >
          View public wiki page →
        </Link>
      </div>

      {params.saved === "1" && (
        <div
          className="mt-4 rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--card-border)" }}
        >
          ✓ Universe details saved
        </div>
      )}

      <form
        action={saveUniverse}
        encType="multipart/form-data"
        className="mt-6 rounded-xl border p-5 space-y-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div>
          <label className="block mb-2 font-medium">
            Banner Image (optional)
          </label>

          {universe.banner_url && (
            <img
              src={universe.banner_url}
              alt="Current banner"
              className="mb-3 h-32 w-full rounded-lg object-cover"
            />
          )}

          <input
            type="file"
            name="banner"
            accept="image/*"
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">
            Universe Name
          </label>

          <input
            name="name"
            defaultValue={universe.name}
            required
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Description
          </label>

          <textarea
            name="description"
            defaultValue={universe.description ?? ""}
            rows={3}
            placeholder="A short pitch for your universe — its tone, its central conflict, its hook."
            className="w-full border rounded-lg p-3"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Save
        </button>
      </form>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Wiki Entries
        </h2>

        <Link
          href="/my-universe/entities/new"
          className="px-4 py-2 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          + New Entity
        </Link>
      </div>

      {!entities || entities.length === 0 ? (
        <div
          className="mt-6 rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-70">
            No wiki entries yet — start with a character
            or a location from one of your stories.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <section key={type} className="mt-8">
            <h3 className="font-semibold mb-3 opacity-80">
              {getEntityTypeIcon(type)}{" "}
              {getEntityTypeLabel(type)}s
            </h3>

            <div className="space-y-2">
              {(items as any[]).map((entity) => (
                <Link
                  key={entity.id}
                  href={`/my-universe/entities/${entity.id}/edit`}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    p-3
                    text-sm
                    hover:shadow-md
                    transition
                  "
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                >
                  <span className="font-medium">
                    {entity.name}
                  </span>

                  <span className="opacity-50">
                    Edit →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
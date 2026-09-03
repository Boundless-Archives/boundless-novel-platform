import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type UserRole =
  | "reader"
  | "author"
  | "editor"
  | "admin"
  | "superadmin";

type UserProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  is_author: boolean;
  role: string;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !currentProfile ||
    !["admin", "superadmin"].includes(currentProfile.role)
  ) {
    redirect("/");
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, is_author, role, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h1 className="text-xl font-semibold text-foreground">
              Unable to load users
            </h1>

            <p className="mt-2 text-sm text-foreground/60">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const userList = (users ?? []) as UserProfile[];
  const isSuperadmin = currentProfile.role === "superadmin";

  const authorCount = userList.filter(
    (profile) =>
      profile.role === "author" ||
      profile.role === "editor" ||
      profile.role === "admin" ||
      profile.role === "superadmin"
  ).length;

  const editorCount = userList.filter(
    (profile) => profile.role === "editor"
  ).length;

  const adminCount = userList.filter(
    (profile) =>
      profile.role === "admin" ||
      profile.role === "superadmin"
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              👥
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/60">
                Administration
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                User Management
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-foreground/65">
            View Boundless users and manage their platform roles.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={userList.length}
          />

          <StatCard
            label="Authors"
            value={authorCount}
          />

          <StatCard
            label="Editors"
            value={editorCount}
          />

          <StatCard
            label="Admins"
            value={adminCount}
          />
        </div>

        {/* User list */}
        <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-card-border px-6 py-5">
            <h2 className="font-semibold text-foreground">
              All Users
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              {userList.length} registered users
            </p>
          </div>

          <div className="divide-y divide-card-border">
            {userList.map((profile) => (
              <UserRow
                key={profile.id}
                profile={profile}
                canChangeRoles={
                  isSuperadmin && profile.id !== user.id
                }
              />
            ))}

            {userList.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-foreground/60">
                  No users found.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Permission notice */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {isSuperadmin ? "👑" : "🛡️"}
            </span>

            <div>
              <p className="font-medium text-foreground">
                {isSuperadmin
                  ? "Superadmin access"
                  : "Admin access"}
              </p>

              <p className="mt-1 text-sm leading-6 text-foreground/60">
                {isSuperadmin
                  ? "You can change user roles. Your own role cannot be changed from this interface."
                  : "You can view users, but only a Superadmin can change platform roles."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function getInitial(profile: UserProfile) {
  const name =
    profile.display_name?.trim() ||
    profile.username?.trim() ||
    "";

  const firstCharacter = Array.from(name)[0];

  if (!firstCharacter) {
    return "?";
  }

  return firstCharacter.toUpperCase();
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
      <p className="text-sm text-foreground/55">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function UserRow({
  profile,
  canChangeRoles,
}: {
  profile: UserProfile;
  canChangeRoles: boolean;
}) {
  const role = profile.role as UserRole;

  return (
    <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      {/* User */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-card-border bg-background font-semibold text-foreground">
          {getInitial(profile)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {profile.display_name?.trim() ||
              profile.username?.trim() ||
              "Unnamed user"}
          </p>

          <p className="truncate text-sm text-foreground/55">
            @{profile.username?.trim() || "unknown"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-3">
        <RoleBadge role={role} />

        {profile.is_author && (
          <span className="rounded-full border border-card-border bg-background px-3 py-1 text-xs font-medium text-foreground/65">
            Author Access
          </span>
        )}
      </div>

      {/* Role control */}
      <div className="flex items-center gap-3">
        {canChangeRoles ? (
          <RoleSelector
            userId={profile.id}
            currentRole={role}
          />
        ) : (
          <span className="text-xs text-foreground/40">
            {role === "superadmin"
              ? "Protected"
              : "View only"}
          </span>
        )}
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  const labels: Record<UserRole, string> = {
    reader: "Reader",
    author: "Author",
    editor: "Editor",
    admin: "Admin",
    superadmin: "Superadmin",
  };

  return (
    <span className="rounded-full border border-card-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
      {role === "superadmin" && "👑 "}
      {role === "admin" && "🛡️ "}
      {role === "editor" && "📝 "}
      {labels[role]}
    </span>
  );
}

function RoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  return (
    <form action={changeUserRole}>
      <input
        type="hidden"
        name="userId"
        value={userId}
      />

      <select
        name="role"
        defaultValue={currentRole}
        className="
          rounded-xl
          border
          border-card-border
          bg-background
          px-3
          py-2
          text-sm
          font-medium
          text-foreground
          outline-none
          transition
          focus:ring-2
          focus:ring-foreground/10
        "
      >
        <option value="reader">Reader</option>
        <option value="author">Author</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>

      <button
        type="submit"
        className="
          ml-2
          rounded-xl
          bg-button
          px-3
          py-2
          text-sm
          font-semibold
          text-button-text
          transition
          hover:opacity-90
          active:scale-[0.98]
        "
      >
        Save
      </button>
    </form>
  );
}

async function changeUserRole(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") {
    redirect("/");
  }

  const targetUserId = formData.get("userId");
  const newRole = formData.get("role");

  if (
    typeof targetUserId !== "string" ||
    typeof newRole !== "string"
  ) {
    redirect("/admin/users");
  }

  if (
    ![
      "reader",
      "author",
      "editor",
      "admin",
      "superadmin",
    ].includes(newRole)
  ) {
    redirect("/admin/users");
  }

  if (targetUserId === user.id) {
    redirect("/admin/users");
  }

  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/users");
}
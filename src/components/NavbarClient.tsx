"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  Home,
  Compass,
  Flame,
  Library as LibraryIcon,
  PenLine,
  Sparkles,
  Map as MapIcon,
  Megaphone,
  Bell,
  Menu,
  X,
  Search,
  User,
  LogOut,
  Shield,
  FileEdit,
  type LucideIcon,
} from "lucide-react";

type UserRole =
  | "reader"
  | "author"
  | "editor"
  | "admin"
  | "superadmin"
  | null;

type NavbarClientProps = {
  user: boolean;
  isAuthor: boolean;
  role: UserRole;
  unreadNotificationCount: number;
};

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  show: boolean;
};

export default function NavbarClient({
  user,
  isAuthor,
  role,
  unreadNotificationCount,
}: NavbarClientProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const canManage =
    role === "editor" ||
    role === "admin" ||
    role === "superadmin";

  const manageHref = role === "editor" ? "/editor" : "/admin";

  const manageLabel =
    role === "editor"
      ? "Editor"
      : role === "superadmin"
      ? "Admin"
      : "Manage";

  const ManageIcon = role === "editor" ? FileEdit : Shield;

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Home", Icon: Home, show: true },
      { href: "/explore", label: "Explore", Icon: Compass, show: true },
      { href: "/trending", label: "Trending", Icon: Flame, show: true },
      { href: "/library", label: "Library", Icon: LibraryIcon, show: user },
      { href: "/stories", label: "Write", Icon: PenLine, show: isAuthor },
      { href: "/wiki", label: "Wiki", Icon: Sparkles, show: true },
      {
        href: "/my-universe",
        label: "My Universe",
        Icon: MapIcon,
        show: isAuthor,
      },
    ],
    [user, isAuthor]
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header
      className="
        sticky
        top-0
        z-[9998]
        border-b
        backdrop-blur-xl
      "
      style={{
        backgroundColor:
          "color-mix(in srgb,var(--background) 88%,transparent)",
        borderColor: "var(--card-border)",
      }}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1800px]
          px-8
          py-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-6
          "
        >
          {/* Logo / mobile menu */}
          <div
            className="
              flex
              shrink-0
              items-center
              gap-4
            "
          >
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="
                relative
                z-[9999]
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                transition
                hover:bg-[var(--card)]
                active:scale-95
                2xl:hidden
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="
                flex
                items-center
                gap-3
                transition
                hover:scale-[1.02]
              "
            >
              <Image
                src="/branding/icon.png"
                alt="Boundless"
                width={76}
                height={76}
                priority
              />

              <span
                className="
                  font-serif
                  text-2xl
                  font-semibold
                  tracking-tight
                "
                style={{ color: "var(--accent)" }}
              >
                Boundless
              </span>
            </Link>
          </div>

          {/* Full desktop navigation */}
          <div
            className="
              hidden
              min-w-0
              flex-1
              justify-center
              2xl:flex
            "
          >
            <nav
              className="
                flex
                items-center
                justify-center
                gap-0.5
                whitespace-nowrap
                overflow-x-auto
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative
                      flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-xl
                      px-2.5
                      py-2
                      text-sm
                      font-medium
                      transition-all
                      duration-200
                      ${
                        isActive(item.href)
                          ? "font-semibold"
                          : ""
                      }
                    `}
                    style={{
                      backgroundColor: isActive(item.href)
                        ? "var(--card)"
                        : "transparent",
                      color: isActive(item.href)
                        ? "var(--accent)"
                        : "inherit",
                    }}
                  >
                    <item.Icon size={16} />

                    {item.label}

                    {isActive(item.href) && (
                      <span
                        className="
                          absolute
                          left-3
                          right-3
                          -bottom-1
                          h-0.5
                          rounded-full
                        "
                        style={{
                          backgroundColor: "var(--accent)",
                        }}
                      />
                    )}
                  </Link>
                ))}

              {/* Admin / Manage / Editor — retains label */}
              {user && canManage && (
                <Link
                  href={manageHref}
                  className={`
                    flex
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-xl
                    px-2.5
                    py-2
                    text-sm
                    font-medium
                    transition-all
                    duration-200
                    ${
                      isActive(manageHref)
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    backgroundColor: isActive(manageHref)
                      ? "var(--card)"
                      : "transparent",
                    color: isActive(manageHref)
                      ? "var(--accent)"
                      : "inherit",
                  }}
                >
                  <ManageIcon size={16} />
                  {manageLabel}
                </Link>
              )}

              {/* Announcements — icon only */}
              <Link
                href="/announcements"
                aria-label="Announcements"
                title="Announcements"
                className="
                  relative
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  transition-all
                  duration-200
                  hover:bg-[var(--card)]
                  active:scale-95
                "
                style={{
                  backgroundColor: isActive("/announcements")
                    ? "var(--card)"
                    : "transparent",
                  color: isActive("/announcements")
                    ? "var(--accent)"
                    : "inherit",
                }}
              >
                <Megaphone size={18} />

                {isActive("/announcements") && (
                  <span
                    className="
                      absolute
                      left-2
                      right-2
                      -bottom-1
                      h-0.5
                      rounded-full
                    "
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </Link>

              {/* Notifications — icon only */}
              {user && (
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  title="Notifications"
                  className="
                    relative
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    transition-all
                    duration-200
                    hover:bg-[var(--card)]
                    active:scale-95
                  "
                  style={{
                    backgroundColor: isActive("/notifications")
                      ? "var(--card)"
                      : "transparent",
                    color: isActive("/notifications")
                      ? "var(--accent)"
                      : "inherit",
                  }}
                >
                  <Bell size={18} />

                  {unreadNotificationCount > 0 && (
                    <span
                      className="
                        absolute
                        -right-1
                        -top-1
                        flex
                        h-5
                        min-w-5
                        items-center
                        justify-center
                        rounded-full
                        px-1
                        text-[10px]
                        font-bold
                      "
                      style={{
                        backgroundColor: "var(--button)",
                        color: "var(--button-text)",
                      }}
                    >
                      {unreadNotificationCount > 99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}

                  {isActive("/notifications") && (
                    <span
                      className="
                        absolute
                        left-2
                        right-2
                        -bottom-1
                        h-0.5
                        rounded-full
                      "
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Full desktop controls */}
          <div
            className="
              hidden
              shrink-0
              items-center
              gap-3
              2xl:flex
            "
          >
            <form
              action="/search"
              method="GET"
              className="relative"
            >
              <input
                type="search"
                name="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories..."
                className="
                  w-64
                  rounded-xl
                  border
                  py-2
                  pl-10
                  pr-4
                  outline-none
                  transition
                  focus:w-72
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              />

              <Search
                size={16}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  opacity-60
                "
              />
            </form>

            <ThemeToggle />

            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  className="
                    rounded-xl
                    px-4
                    py-2
                    transition-all
                    duration-200
                    hover:bg-[var(--card)]
                    active:scale-95
                  "
                >
                  Login
                </Link>

                <Link
                  href="/auth/signup"
                  className="
                    rounded-xl
                    px-5
                    py-2
                    font-semibold
                    transition-all
                    duration-200
                    hover:scale-105
                    active:scale-95
                  "
                  style={{
                    backgroundColor: "var(--button)",
                    color: "var(--button-text)",
                  }}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    px-4
                    py-2
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-md
                    active:scale-95
                    ${
                      pathname.startsWith("/profile")
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: pathname.startsWith(
                      "/profile"
                    )
                      ? "var(--card)"
                      : "transparent",
                    color: pathname.startsWith("/profile")
                      ? "var(--accent)"
                      : "inherit",
                  }}
                >
                  <User size={16} />
                  Profile
                </Link>

                <Link
                  href="/auth/logout"
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    px-4
                    py-2
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-md
                    active:scale-95
                  "
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {mobileOpen && (
        <div
          className="
            border-t
            2xl:hidden
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          <div className="p-4">
            <form
              action="/search"
              method="GET"
              className="relative mb-5"
            >
              <input
                type="search"
                name="q"
                placeholder="Search stories..."
                className="
                  w-full
                  rounded-xl
                  border
                  py-3
                  pl-10
                  pr-4
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              />

              <Search
                size={16}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  opacity-60
                "
              />
            </form>

            <nav
              className="
                flex
                flex-col
                gap-2
              "
            >
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      ${
                        isActive(item.href)
                          ? "font-semibold"
                          : ""
                      }
                    `}
                    style={{
                      backgroundColor: isActive(item.href)
                        ? "var(--card)"
                        : "transparent",
                      color: isActive(item.href)
                        ? "var(--accent)"
                        : "inherit",
                      borderLeft: isActive(item.href)
                        ? "4px solid var(--accent)"
                        : "4px solid transparent",
                    }}
                  >
                    <item.Icon size={18} />
                    {item.label}
                  </Link>
                ))}

              {/* Mobile announcements */}
              <Link
                href="/announcements"
                onClick={() => setMobileOpen(false)}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  transition-all
                  duration-200
                  ${
                    isActive("/announcements")
                      ? "font-semibold"
                      : ""
                  }
                `}
                style={{
                  backgroundColor: isActive("/announcements")
                    ? "var(--card)"
                    : "transparent",
                  color: isActive("/announcements")
                    ? "var(--accent)"
                    : "inherit",
                  borderLeft: isActive("/announcements")
                    ? "4px solid var(--accent)"
                    : "4px solid transparent",
                }}
              >
                <Megaphone size={18} />
                Announcements
              </Link>

              {/* Mobile notifications */}
              {user && (
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={`
                    relative
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    transition-all
                    duration-200
                    ${
                      isActive("/notifications")
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    backgroundColor: isActive("/notifications")
                      ? "var(--card)"
                      : "transparent",
                    color: isActive("/notifications")
                      ? "var(--accent)"
                      : "inherit",
                    borderLeft: isActive("/notifications")
                      ? "4px solid var(--accent)"
                      : "4px solid transparent",
                  }}
                >
                  <Bell size={18} />
                  Notifications
                  {unreadNotificationCount > 0 && (
                    <span
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        flex
                        h-5
                        min-w-5
                        items-center
                        justify-center
                        rounded-full
                        px-1
                        text-[10px]
                        font-bold
                      "
                      style={{
                        backgroundColor: "var(--button)",
                        color: "var(--button-text)",
                      }}
                    >
                      {unreadNotificationCount > 99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile admin / manage */}
              {user && canManage && (
                <Link
                  href={manageHref}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    transition-all
                    duration-200
                    ${
                      isActive(manageHref)
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    backgroundColor: isActive(manageHref)
                      ? "var(--card)"
                      : "transparent",
                    color: isActive(manageHref)
                      ? "var(--accent)"
                      : "inherit",
                    borderLeft: isActive(manageHref)
                      ? "4px solid var(--accent)"
                      : "4px solid transparent",
                  }}
                >
                  <ManageIcon size={18} />
                  {manageLabel}
                </Link>
              )}
            </nav>

            <div
              className="
                mt-5
                border-t
                pt-5
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm opacity-70">Theme</span>

                <ThemeToggle />
              </div>

              {!user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      hover:bg-[var(--card)]
                      active:scale-95
                    "
                  >
                    Login
                  </Link>

                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="
                      rounded-xl
                      px-4
                      py-3
                      text-center
                      font-semibold
                      transition-all
                      duration-200
                      hover:scale-[1.02]
                      active:scale-95
                    "
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      active:scale-95
                      ${
                        pathname.startsWith("/profile")
                          ? "font-semibold"
                          : ""
                      }
                    `}
                    style={{
                      backgroundColor: pathname.startsWith(
                        "/profile"
                      )
                        ? "var(--card)"
                        : "transparent",
                      color: pathname.startsWith("/profile")
                        ? "var(--accent)"
                        : "inherit",
                    }}
                  >
                    <User size={18} />
                    Profile
                  </Link>

                  <Link
                    href="/auth/logout"
                    onClick={() => setMobileOpen(false)}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      active:scale-95
                    "
                  >
                    <LogOut size={18} />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
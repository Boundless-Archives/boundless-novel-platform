"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

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

  const manageHref =
    role === "editor"
      ? "/editor"
      : "/admin";

  const manageLabel =
    role === "editor"
      ? "Editor"
      : role === "superadmin"
        ? "Admin"
        : "Manage";

  const navItems = useMemo(
    () => [
      {
        href: "/",
        label: "Home",
        icon: "🏠",
        show: true,
      },

      {
        href: "/explore",
        label: "Explore",
        icon: "🔎",
        show: true,
      },

      {
        href: "/trending",
        label: "Trending",
        icon: "🔥",
        show: true,
      },

      {
        href: "/library",
        label: "Library",
        icon: "📚",
        show: user,
      },

      {
        href: "/stories",
        label: "Write",
        icon: "✍️",
        show: isAuthor,
      },

      {
        href: "/announcements",
        label: "Announcements",
        icon: "📢",
        show: true,
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
          max-w-7xl
          px-5
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
          <div
            className="
              flex
              items-center
              gap-4
              shrink-0
            "
          >
            <button
              onClick={() =>
                setMobileOpen(!mobileOpen)
              }
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
                md:hidden
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              <span className="text-xl">
                {mobileOpen ? "✕" : "☰"}
              </span>
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
                  text-2xl
                  font-bold
                  tracking-tight
                "
              >
                Boundless
              </span>
            </Link>
          </div>

          <div
            className="
              hidden
              flex-1
              justify-center
              md:flex
            "
          >
            <nav
              className="
                flex
                items-center
                gap-2
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
                      rounded-xl
                      px-4
                      py-2
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
                      backgroundColor:
                        isActive(item.href)
                          ? "var(--card)"
                          : "transparent",
                    }}
                  >
                    <span className="mr-2">
                      {item.icon}
                    </span>

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
                          background:
                            "linear-gradient(90deg,#06b6d4,#3b82f6)",
                        }}
                      />
                    )}
                  </Link>
                ))}

              {user && (
                <Link
                  href="/notifications"
                  className={`
                    relative
                    rounded-xl
                    px-4
                    py-2
                    font-medium
                    transition-all
                    duration-200
                    ${
                      isActive("/notifications")
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    backgroundColor:
                      isActive("/notifications")
                        ? "var(--card)"
                        : "transparent",
                  }}
                >
                  <span className="mr-2">
                    🔔
                  </span>

                  Notifications

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
                        backgroundColor:
                          "var(--button)",
                        color:
                          "var(--button-text)",
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
                        left-3
                        right-3
                        -bottom-1
                        h-0.5
                        rounded-full
                      "
                      style={{
                        background:
                          "linear-gradient(90deg,#06b6d4,#3b82f6)",
                      }}
                    />
                  )}
                </Link>
              )}

              {user && canManage && (
                <Link
                  href={manageHref}
                  className={`
                    rounded-xl
                    px-4
                    py-2
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
                    backgroundColor:
                      isActive(manageHref)
                        ? "var(--card)"
                        : "transparent",
                  }}
                >
                  <span className="mr-2">
                    {role === "editor"
                      ? "📝"
                      : "🛡️"}
                  </span>

                  {manageLabel}
                </Link>
              )}
            </nav>
          </div>

          <div
            className="
              hidden
              items-center
              gap-4
              md:flex
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
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
                  backgroundColor:
                    "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              />

              <span
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  opacity-60
                "
              >
                🔍
              </span>
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
                    backgroundColor:
                      "var(--button)",
                    color:
                      "var(--button-text)",
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
                      pathname.startsWith(
                        "/profile"
                      )
                        ? "font-semibold"
                        : ""
                    }
                  `}
                  style={{
                    borderColor:
                      "var(--card-border)",
                    backgroundColor:
                      pathname.startsWith(
                        "/profile"
                      )
                        ? "var(--card)"
                        : "transparent",
                  }}
                >
                  👤 Profile
                </Link>

                <Link
                  href="/auth/logout"
                  className="
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
                    borderColor:
                      "var(--card-border)",
                  }}
                >
                  Logout
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="
            border-t
            md:hidden
          "
          style={{
            borderColor:
              "var(--card-border)",
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
                  backgroundColor:
                    "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              />

              <span
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  opacity-60
                "
              >
                🔍
              </span>
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
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className={`
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
                      backgroundColor:
                        isActive(item.href)
                          ? "var(--card)"
                          : "transparent",
                      borderLeft:
                        isActive(item.href)
                          ? "4px solid #06b6d4"
                          : "4px solid transparent",
                    }}
                  >
                    <span className="mr-3">
                      {item.icon}
                    </span>

                    {item.label}
                  </Link>
                ))}

              {user && (
                <Link
                  href="/notifications"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={`
                    relative
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
                    backgroundColor:
                      isActive("/notifications")
                        ? "var(--card)"
                        : "transparent",
                    borderLeft:
                      isActive("/notifications")
                        ? "4px solid #06b6d4"
                        : "4px solid transparent",
                  }}
                >
                  <span className="mr-3">
                    🔔
                  </span>

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
                        backgroundColor:
                          "var(--button)",
                        color:
                          "var(--button-text)",
                      }}
                    >
                      {unreadNotificationCount > 99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </Link>
              )}

              {user && canManage && (
                <Link
                  href={manageHref}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={`
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
                    backgroundColor:
                      isActive(manageHref)
                        ? "var(--card)"
                        : "transparent",
                    borderLeft:
                      isActive(manageHref)
                        ? "4px solid #06b6d4"
                        : "4px solid transparent",
                  }}
                >
                  <span className="mr-3">
                    {role === "editor"
                      ? "📝"
                      : "🛡️"}
                  </span>

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
                borderColor:
                  "var(--card-border)",
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm opacity-70">
                  Theme
                </span>

                <ThemeToggle />
              </div>

              {!user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() =>
                      setMobileOpen(false)
                    }
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
                    onClick={() =>
                      setMobileOpen(false)
                    }
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
                      backgroundColor:
                        "var(--button)",
                      color:
                        "var(--button-text)",
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className={`
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      active:scale-95
                      ${
                        pathname.startsWith(
                          "/profile"
                        )
                          ? "font-semibold"
                          : ""
                      }
                    `}
                    style={{
                      backgroundColor:
                        pathname.startsWith(
                          "/profile"
                        )
                          ? "var(--card)"
                          : "transparent",
                    }}
                  >
                    👤 Profile
                  </Link>

                  <Link
                    href="/auth/logout"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className="
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200
                      active:scale-95
                    "
                  >
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
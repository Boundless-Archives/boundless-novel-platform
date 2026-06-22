import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        Boundless Novel Platform
      </h1>

      <p className="mt-4">
        Read stories. Write stories. Build worlds.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/auth/login"
          className="rounded border px-4 py-2"
        >
          Login
        </Link>

        <Link
          href="/auth/signup"
          className="rounded border px-4 py-2"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
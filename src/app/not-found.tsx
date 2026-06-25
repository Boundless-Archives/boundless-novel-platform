import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">

      <div className="text-7xl mb-6">
        📚
      </div>

      <h1 className="text-5xl font-bold">
        Page Not Found
      </h1>

      <p className="mt-4 text-lg opacity-70">
        We searched every shelf, scroll, and 
        forgotten corner of the Boundless Archives, 
        yet the knowledge you seek could not be found. 
        Perhaps it never existed to begin with.

      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">

        <Link
          href="/"
          className="
            px-5
            py-3
            rounded-lg
            border
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Go Home
        </Link>

        <Link
          href="/search"
          className="
            px-5
            py-3
            rounded-lg
            border
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Search Stories
        </Link>

      </div>

    </main>
  );
}
"use client";

export default function GlobalError() {
  return (
    <html>
      <body>
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center">

            <div className="text-7xl mb-6">
              💥
            </div>

            <h1 className="text-4xl font-bold">
              By The Gods - The Archives Have Collapsed
            </h1>

            <p className="mt-4 opacity-70">
              Something went seriously wrong.
            </p>

            <button
              onClick={() => location.reload()}
              className="
                mt-8
                px-5
                py-3
                rounded-lg
                border
                transition
                hover:shadow-md
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              Reload Boundless
          </button>

          </div>
        </main>
      </body>
    </html>
  );
}
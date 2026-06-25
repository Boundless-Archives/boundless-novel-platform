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
              By The Gods - Boundless Crashed
            </h1>

            <p className="mt-4 opacity-70">
              Something went seriously wrong.
            </p>

            <button
              className="mt-8 border rounded-lg px-5 py-3"
              onClick={() => location.reload()}
            >
              Reload to Save the Universe
            </button>

          </div>
        </main>
      </body>
    </html>
  );
}
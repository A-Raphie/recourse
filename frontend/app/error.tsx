"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-start justify-center px-4 sm:px-6">
      <p className="micro mb-3" style={{ color: "var(--status-error)" }}>
        Chain error
      </p>
      <h1 className="mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>
        The GenLayer RPC failed on this one.
      </h1>
      <p className="caption mb-7 max-w-lg">
        Reads go straight to the studio network. It refuses sometimes; the state
        is fine. Retry.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Retry
      </button>
    </main>
  );
}

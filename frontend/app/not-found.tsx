import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-start justify-center px-4 sm:px-6">
      <p className="micro mb-3">404</p>
      <h1 className="mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>
        No such case on the docket.
      </h1>
      <p className="caption mb-7 max-w-lg">
        The dispute id does not exist on the ledger. Every filed dispute is
        readable from the live feed.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to the feed
      </Link>
    </main>
  );
}

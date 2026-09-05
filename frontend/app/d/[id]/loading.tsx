export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <div className="skeleton mb-4 h-6 w-40" />
      <div className="skeleton mb-8 h-16 w-64" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="skeleton h-96 lg:col-span-3" />
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="skeleton h-36" />
          <div className="skeleton h-72" />
        </div>
      </div>
    </main>
  );
}

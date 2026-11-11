import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Document not available</h1>
      <p className="mt-2 text-gray-500">
        It doesn&apos;t exist, or it hasn&apos;t been shared with the user you&apos;re signed in as.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        Back to documents
      </Link>
    </main>
  );
}

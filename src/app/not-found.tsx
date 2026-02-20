import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE]">
      <div className="text-center p-8">
        <h2 className="font-display text-6xl text-[#2A2A2A] mb-4">404</h2>
        <p className="font-body text-[#2A2A2A]/70 mb-6">
          This page doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#E88B5A] text-[#FEFEFE] font-display text-sm px-6 py-3 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

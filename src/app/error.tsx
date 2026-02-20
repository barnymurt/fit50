'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE]">
      <div className="text-center p-8">
        <h2 className="font-display text-4xl text-[#2A2A2A] mb-4">Something went wrong!</h2>
        <p className="font-body text-[#2A2A2A]/70 mb-6">
          We encountered an error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[#E88B5A] text-[#FEFEFE] font-display text-sm px-6 py-3 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

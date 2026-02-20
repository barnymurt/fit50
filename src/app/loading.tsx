export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#E88B5A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-body text-[#2A2A2A]/70">Loading...</p>
      </div>
    </div>
  );
}

export function Preloader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* Simple spinning ring */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        </div>

        {/* Loading text */}
        <p className="text-lg font-semibold text-foreground/90 mb-2">Please wait...</p>
      </div>
    </div>
  );
}

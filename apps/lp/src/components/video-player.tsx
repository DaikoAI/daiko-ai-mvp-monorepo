interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className = "" }: VideoPlayerProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <video
        key={src} // Add key to force re-render on src change
        src={src} // Revert back to using src attribute directly
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-auto object-cover rounded-xl transition-opacity duration-500 ease-in-out`}
      />
    </div>
  );
}

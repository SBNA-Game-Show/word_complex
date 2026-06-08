export default function VideoBackground() {
  return (
    <div className="video-bg" aria-hidden="true">
      <video
        className="video-bg-media"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      <div className="video-bg-grain" />
      <div className="video-bg-overlay" />
    </div>
  );
}
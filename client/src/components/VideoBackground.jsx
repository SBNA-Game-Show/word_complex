export default function VideoBackground() {
  return (
    <div className="video-bg" aria-hidden="true">
      {/* SVG filter defs: a light unsharp-mask style convolution kernel. */}
      <svg className="video-bg-svg-defs" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="video-bg-sharpen">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix="0 -0.35 0  -0.35 2.4 -0.35  0 -0.35 0"
            />
          </filter>
        </defs>
      </svg>

      <img
        className="video-bg-media"
        src="/scenes/house-hill.webp"
        alt=""
      />
      <div className="video-bg-grain" />
      <div className="video-bg-overlay" />
    </div>
  );
}

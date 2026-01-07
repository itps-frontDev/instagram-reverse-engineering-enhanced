// Simple Instagram-style dotted spinner
// Instagram-style spinner: 12 rounded bars, animated opacity
export default function LoadingSpinner({ size = 50, className = '' }: { size?: number; className?: string }) {
  const barCount = 12;
  const bars = Array.from({ length: barCount });
  const center = 50;
  const barWidth = 25;
  const barHeight = 6;
  const rx = 3;
  const color = '#555';
  return (
    <span
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        {bars.map((_, i) => {
          const angle = (360 / barCount) * i;
          // Make the first two bars more transparent for the closing effect
          let baseOpacity = 0.2 + 0.8 * (i / barCount);
          if (i === 0) baseOpacity = 0.13;
          if (i === 1) baseOpacity = 0.18;
          return (
            <rect
              key={i}
              x={center + 22}
              y={center - barHeight / 2}
              width={barWidth}
              height={barHeight}
              rx={rx}
              ry={rx}
              fill={color}
              opacity={baseOpacity}
              transform={`rotate(${angle} ${center} ${center})`}
            >
              <animate
                attributeName="opacity"
                values="1;0.2;1"
                keyTimes="0;0.5;1"
                dur="1s"
                begin={`${(i / barCount)}s`}
                repeatCount="indefinite"
              />
            </rect>
          );
        })}
      </svg>
    </span>
  );
}

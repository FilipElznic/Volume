import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, Play, Pause } from "lucide-react";

interface SlingshotVolumeProps {
  volume: number;
  onVolumeChange: (newVolume: number) => void;
  onInteractionStart?: () => void;
  onTogglePlay?: () => void;
  isPlaying?: boolean;
}

const SlingshotVolume: React.FC<SlingshotVolumeProps> = ({
  volume,
  onVolumeChange,
  onInteractionStart,
  onTogglePlay,
  isPlaying = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [isFlying, setIsFlying] = useState(false);

  // Refs for elements and animation
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const volumeLineRef = useRef<HTMLDivElement>(null);
  const playPauseRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const ballVelocity = useRef({ x: 0, y: 0 });
  const initialIconPos = useRef({ x: 0, y: 0 });

  // Constants
  const MAX_DRAG_DIST = 100;
  const POWER_MULTIPLIER = 0.15;
  const GRAVITY = 0.4;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onInteractionStart?.();
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      initialIconPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setIsDragging(true);
    setIsFlying(false);
    setBallPos({ x: 0, y: 0 });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const centerX = initialIconPos.current.x;
      const centerY = initialIconPos.current.y;

      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;

      // Constrain drag to left/down-left mostly, but allow freedom
      // Limit distance
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MAX_DRAG_DIST) {
        const ratio = MAX_DRAG_DIST / dist;
        dx *= ratio;
        dy *= ratio;
      }

      setDragPos({ x: dx, y: dy });
    },
    [isDragging]
  );

  const launchBall = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    setIsFlying(true);
    setBallPos(dragPos);

    // Launch velocity is opposite to drag vector
    // More drag = more power
    ballVelocity.current = {
      x: -dragPos.x * POWER_MULTIPLIER,
      y: -dragPos.y * POWER_MULTIPLIER,
    };

    // Reset drag visual immediately
    setDragPos({ x: 0, y: 0 });

    // Start animation loop
    let lastTime = performance.now();
    let currentPos = { ...dragPos };

    const animate = (time: number) => {
      const dt = (time - lastTime) / 16; // Normalize to ~60fps
      lastTime = time;

      // Update physics
      currentPos.x += ballVelocity.current.x * dt;
      currentPos.y += ballVelocity.current.y * dt;
      ballVelocity.current.y += GRAVITY * dt;

      setBallPos({ ...currentPos });

      // Check collision with volume line
      if (volumeLineRef.current && iconRef.current) {
        const lineRect = volumeLineRef.current.getBoundingClientRect();
        const iconRect = iconRef.current.getBoundingClientRect();

        // Convert ball local coords to screen coords for check
        const iconCenterX = iconRect.left + iconRect.width / 2;
        const iconCenterY = iconRect.top + iconRect.height / 2;

        const ballScreenX = iconCenterX + currentPos.x;
        const ballScreenY = iconCenterY + currentPos.y;

        // Check collision with Play/Pause button
        if (playPauseRef.current) {
          const playRect = playPauseRef.current.getBoundingClientRect();
          const playCenterX = playRect.left + playRect.width / 2;
          const playCenterY = playRect.top + playRect.height / 2;

          // Simple distance check for circular target
          const distToPlay = Math.sqrt(
            Math.pow(ballScreenX - playCenterX, 2) +
              Math.pow(ballScreenY - playCenterY, 2)
          );

          if (distToPlay < 25) {
            // Hit radius
            onTogglePlay?.();
            setIsFlying(false);
            return;
          }
        }

        // Check if ball crosses the line's Y level
        const lineTop = lineRect.top;
        const lineBottom = lineRect.bottom;
        const lineLeft = lineRect.left;
        const lineRight = lineRect.right;

        if (
          ballScreenX >= lineLeft &&
          ballScreenX <= lineRight &&
          ballScreenY >= lineTop - 10 &&
          ballScreenY <= lineBottom + 10
        ) {
          // Landed!
          const relativeX = ballScreenX - lineLeft;
          const lineWidth = lineRect.width;
          const newVolume = Math.max(0, Math.min(1, relativeX / lineWidth));

          onVolumeChange(newVolume);
          setIsFlying(false);
          return; // Stop animation
        }

        // Stop if off screen
        if (
          ballScreenY > window.innerHeight ||
          ballScreenX > window.innerWidth
        ) {
          setIsFlying(false);
          return; // Stop animation
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isDragging, dragPos, onVolumeChange, onTogglePlay]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", launchBall);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", launchBall);
    };
  }, [isDragging, handleMouseMove, launchBall]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-8 select-none" ref={containerRef}>
      {/* Slingshot Area */}
      <div className="relative">
        {/* The Rubber Band Line */}
        {isDragging && (
          <svg
            className="absolute top-1/2 left-1/2 overflow-visible pointer-events-none"
            style={{ zIndex: -1 }}
            width="0"
            height="0"
          >
            <line
              x1={0}
              y1={0}
              x2={dragPos.x}
              y2={dragPos.y}
              stroke="#4b5563"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* The Speaker Icon (Draggable) */}
        <div
          ref={iconRef}
          onMouseDown={handleMouseDown}
          className={`cursor-grab active:cursor-grabbing p-2 rounded-full bg-white shadow-lg transition-transform ${
            isDragging ? "scale-110" : ""
          }`}
          style={{
            transform: isDragging
              ? `translate(${dragPos.x}px, ${dragPos.y}px)`
              : "translate(0,0)",
            zIndex: 10,
          }}
        >
          <Volume2 className="w-8 h-8 text-gray-700" />
        </div>

        {/* The Projectile Ball */}
        {isFlying && (
          <div
            className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              transform: `translate(calc(-50% + ${ballPos.x}px), calc(-50% + ${ballPos.y}px))`,
            }}
          />
        )}
      </div>

      {/* Volume Line */}
      <div
        className="relative w-64 h-4 bg-gray-200 rounded-full"
        ref={volumeLineRef}
      >
        {/* Fill based on current volume */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${volume * 100}%` }}
        />

        {/* Markers for visual reference */}
        <div className="absolute top-4 left-0 text-xs text-gray-400">0%</div>
        <div className="absolute top-4 right-0 text-xs text-gray-400">100%</div>
      </div>

      {/* Play/Pause Target */}
      <div
        ref={playPauseRef}
        className="absolute bottom-0 -right-24 -translate-x-1/2 w-12 h-12 bg-gray-100 rounded-full border-2 border-gray-300 flex items-center justify-center shadow-sm"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-gray-600" />
        ) : (
          <Play className="w-5 h-5 text-gray-600 ml-1" />
        )}
        <div className="absolute -bottom-6 text-xs text-gray-400 whitespace-nowrap">
          Hit to Pause
        </div>
      </div>
    </div>
  );
};

export default SlingshotVolume;

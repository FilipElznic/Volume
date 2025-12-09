import { useState, useRef, useEffect } from "react";
import SlingshotVolume from "./components/SlingshotVolume";

function App() {
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleInteractionStart = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log("Audio play failed", e));
    }
  };

  // Initialize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Background GIF (Rick Roll) */}
      {isPlaying && (
        <div className="absolute inset-0 z-0">
          <img
            src="https://media1.tenor.com/m/x8v1oNUOmg4AAAAC/rick-roll-rick.gif"
            className="w-full h-full object-cover opacity-60"
            alt="Background"
          />
        </div>
      )}

      <div className="relative z-10 scale-150">
        <SlingshotVolume
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onInteractionStart={handleInteractionStart}
        />
      </div>

      {/* Demo Audio */}
      <audio ref={audioRef} loop src="/nevergonna.mp3" />
    </div>
  );
}

export default App;

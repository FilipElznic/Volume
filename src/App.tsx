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
    if (audioRef.current && audioRef.current.paused && !isPlaying) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log("Audio play failed", e));
    }
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .catch((e) => console.log("Audio play failed", e));
        setIsPlaying(true);
      }
    }
  };

  // Initialize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
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

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 drop-shadow-sm">
            Drag and play
          </h1>
          <p className="text-gray-600 font-medium">
            Drag the speaker back and release to set the volume!
          </p>
        </div>

        <div className="bg-white p-12 rounded-2xl shadow-xl">
          <SlingshotVolume
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onInteractionStart={handleInteractionStart}
            onTogglePlay={handleTogglePlay}
            isPlaying={isPlaying}
          />
        </div>

        <div className="mt-8 text-sm text-gray-500 font-medium bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
          Current Volume: {Math.round(volume * 100)}%
        </div>
      </div>

      {/* Demo Audio */}
      <audio ref={audioRef} loop src="/nevergonna.mp3" />
    </div>
  );
}

export default App;

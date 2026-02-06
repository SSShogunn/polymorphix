import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import type { VideoFormat } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  formats: VideoFormat[];
  poster?: string;
  className?: string;
}

export function VideoPlayer({ formats, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  // Sort formats by resolution (highest first)
  const sortedFormats = [...formats]
    .filter((f) => f.streamUrl)
    .sort((a, b) => {
      const resA = parseInt(a.resolution.replace("p", ""));
      const resB = parseInt(b.resolution.replace("p", ""));
      return resB - resA;
    });

  const [currentFormat, setCurrentFormat] = useState<VideoFormat | null>(
    sortedFormats[0] ?? null
  );

  useEffect(() => {
    if (!videoRef.current || !currentFormat?.streamUrl) return;

    // Create video element
    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered", "vjs-fluid");
    videoRef.current.appendChild(videoElement);

    // Initialize player
    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      poster: poster,
      sources: [
        {
          src: currentFormat.streamUrl,
          type: "video/mp4",
        },
      ],
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [currentFormat?.streamUrl, poster]);

  const handleQualityChange = (format: VideoFormat) => {
    if (!playerRef.current || !format.streamUrl) return;

    const currentTime = playerRef.current.currentTime();
    const wasPlaying = !playerRef.current.paused();

    playerRef.current.src({ src: format.streamUrl, type: "video/mp4" });
    playerRef.current.currentTime(currentTime ?? 0);

    if (wasPlaying) {
      playerRef.current.play();
    }

    setCurrentFormat(format);
  };

  if (!currentFormat) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
        <span className="text-muted-foreground">No video available</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={videoRef}
        className="rounded-lg overflow-hidden bg-black"
        data-vjs-player
      />

      {sortedFormats.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Quality:</span>
          <div className="flex gap-1">
            {sortedFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => handleQualityChange(format)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  currentFormat.id === format.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {format.resolution}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

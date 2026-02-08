import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Spinner } from "@/components/ui/spinner";
import { videosAPI, type Video } from "@/lib/api";
import { ArrowLeft, Calendar, Clock, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Watch() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("v");

  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await videosAPI.getVideos();
        const allVideos = res.data;

        const video = allVideos.find((v) => v.id === videoId);
        setCurrentVideo(video || null);

        const suggested = allVideos.filter((v) => v.id !== videoId);
        setSuggestedVideos(suggested);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setCurrentVideo(null);
        setSuggestedVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchData();
    }
  }, [videoId]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/watch?v=${video.id}`);
  };

  if (!videoId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No video selected</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground">
                <VideoIcon className="size-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                Polymorphix
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center space-y-4">
            <Spinner className="size-10 mx-auto" />
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </div>
      ) : !currentVideo ? (
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center size-20 rounded-full bg-muted mb-6 mx-auto">
            <VideoIcon className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Video not found</h3>
          <p className="text-muted-foreground mb-6">
            The video you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/")} size="lg" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </div>
      ) : (
        <div className="container mx-auto px-6 py-6 max-w-[1800px]">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6">
            <div className="space-y-5">
              <div className="bg-black rounded-xl overflow-hidden shadow-xl">
                {currentVideo.formats?.some((f) => f.streamUrl) ? (
                  <VideoPlayer
                    formats={currentVideo.formats.filter((f) => f.streamUrl)}
                    poster={currentVideo.thumbnail?.publicUrl}
                  />
                ) : (
                  <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-3">
                    <Clock className="size-12 text-muted-foreground animate-pulse" />
                    <span className="text-muted-foreground font-medium">
                      Video processing...
                    </span>
                    <span className="text-sm text-muted-foreground/80">
                      This may take a few minutes
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  {currentVideo.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    <span>
                      {new Date(currentVideo.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span
                    className={cn(
                      "capitalize px-3 py-1 rounded-full text-xs font-medium",
                      currentVideo.status === "ready" &&
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      currentVideo.status === "failed" &&
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      (currentVideo.status === "processing" ||
                        currentVideo.status === "pending") &&
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}
                  >
                    {currentVideo.status}
                  </span>
                </div>

                {currentVideo.description && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {currentVideo.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-4">
              <h2 className="text-lg font-semibold px-2">Up Next</h2>
              <div className="space-y-2">
                {suggestedVideos.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <VideoIcon className="size-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No other videos available
                    </p>
                  </div>
                ) : (
                  suggestedVideos.map((video) => (
                    <SuggestedVideoCard
                      key={video.id}
                      video={video}
                      onClick={() => handleVideoClick(video)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SuggestedVideoCardProps {
  video: Video;
  onClick: () => void;
}

function SuggestedVideoCard({ video, onClick }: SuggestedVideoCardProps) {
  const isReady = video.status === "ready";
  const hasFormats = video.formats?.some((f) => f.streamUrl);
  const thumbnailUrl = video.thumbnail?.publicUrl;

  return (
    <div
      className={cn(
        "flex gap-3 p-2 rounded-xl transition-all duration-200",
        isReady && hasFormats
          ? "cursor-pointer hover:bg-muted/50 hover:shadow-sm"
          : "opacity-50 cursor-not-allowed"
      )}
      onClick={isReady && hasFormats ? onClick : undefined}
    >
      <div className="relative flex-shrink-0 w-44 aspect-video bg-muted rounded-lg overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="size-full object-cover transition-transform duration-200 hover:scale-105"
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-muted">
            <VideoIcon className="size-8 text-muted-foreground/50" />
          </div>
        )}
        {!isReady && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Clock className="size-6 text-white animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {new Date(video.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <span
          className={cn(
            "inline-block capitalize px-2 py-0.5 rounded-full text-[10px] font-medium",
            isReady &&
              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            video.status === "failed" &&
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            (video.status === "processing" || video.status === "pending") &&
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}
        >
          {video.status}
        </span>
      </div>
    </div>
  );
}

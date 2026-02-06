import { PlayIcon, ClockIcon, AlertCircleIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Video } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const isReady = video.status === "ready";
  const isFailed = video.status === "failed";
  const isProcessing = video.status === "processing" || video.status === "pending" || video.status === "uploading";
  const hasFormats = video.formats && video.formats.some((f) => f.streamUrl);
  const thumbnailUrl = video.thumbnail?.publicUrl;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isReady && hasFormats && "cursor-pointer hover:shadow-lg"
      )}
      onClick={isReady && hasFormats ? onClick : undefined}
    >
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative group">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="size-full object-cover"
            />
            {isReady && hasFormats && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="size-16 rounded-full bg-white/90 flex items-center justify-center">
                  <PlayIcon className="size-8 text-black ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isFailed ? (
              <>
                <AlertCircleIcon className="size-8 text-destructive" />
                <span className="text-sm">Processing failed</span>
              </>
            ) : isProcessing ? (
              <>
                <ClockIcon className="size-8 animate-pulse" />
                <span className="text-sm capitalize">{video.status}...</span>
              </>
            ) : (
              <span className="text-sm">No thumbnail</span>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-base">{video.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {video.description || "No description"}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "capitalize px-2 py-0.5 rounded-full text-xs font-medium",
              isReady && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              isFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              isProcessing && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            )}
          >
            {video.status}
          </span>
          {video.formats?.length ? (
            <span className="text-xs">
              {video.formats.map((f) => f.resolution).join(" · ")}
            </span>
          ) : null}
          {video.fileSize && (
            <span className="text-xs">{formatFileSize(video.fileSize)}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground pt-0">
        {new Date(video.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </CardFooter>
    </Card>
  );
}

import { PlayIcon, ClockIcon, AlertCircleIcon, Trash2Icon, PencilIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Video } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  deleting?: boolean;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function VideoCard({ video, onClick, onDelete, onEdit, deleting }: VideoCardProps) {
  const isReady = video.status === "ready";
  const isFailed = video.status === "failed";
  const isProcessing = video.status === "processing" || video.status === "pending" || video.status === "uploading";
  const hasFormats = video.formats && video.formats.some((f) => f.streamUrl);
  const thumbnailUrl = video.thumbnail?.publicUrl;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !deleting) {
      onDelete();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 relative group border-border/40",
        isReady && hasFormats && "cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-border"
      )}
      onClick={isReady && hasFormats ? onClick : undefined}
    >
      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        {onEdit && (
          <Button
            variant="secondary"
            size="icon"
            className="size-9 shadow-lg"
            onClick={handleEdit}
          >
            <PencilIcon className="size-4" />
          </Button>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="size-9 shadow-lg"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {isReady && hasFormats && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="size-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                  <PlayIcon className="size-7 ml-1 fill-current" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-4">
            {isFailed ? (
              <>
                <AlertCircleIcon className="size-10 text-destructive" />
                <span className="text-sm font-medium">Processing failed</span>
              </>
            ) : isProcessing ? (
              <>
                <ClockIcon className="size-10 animate-pulse" />
                <span className="text-sm font-medium capitalize">{video.status}...</span>
              </>
            ) : (
              <>
                <PlayIcon className="size-10 opacity-40" />
                <span className="text-sm">No thumbnail</span>
              </>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-3 pt-4">
        <CardTitle className="line-clamp-2 text-base leading-snug font-semibold">
          {video.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3 pt-0 space-y-2">
        <CardDescription className="line-clamp-2 text-sm leading-relaxed">
          {video.description || "No description"}
        </CardDescription>
        
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span
            className={cn(
              "capitalize px-2.5 py-1 rounded-full text-xs font-medium",
              isReady && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              isFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              isProcessing && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            )}
          >
            {video.status}
          </span>
          {video.formats?.length ? (
            <span className="text-xs text-muted-foreground font-medium">
              {video.formats.map((f) => f.resolution).join(" · ")}
            </span>
          ) : null}
          {video.fileSize && (
            <span className="text-xs text-muted-foreground">{formatFileSize(video.fileSize)}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground pt-0 pb-4">
        {new Date(video.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </CardFooter>
    </Card>
  );
}

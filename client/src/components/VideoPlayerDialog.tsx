import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { Video } from "@/lib/api";

interface VideoPlayerDialogProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerDialog({
  video,
  open,
  onOpenChange,
}: VideoPlayerDialogProps) {
  if (!video) return null;

  const availableFormats = video.formats?.filter((f) => f.streamUrl) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl">{video.title}</DialogTitle>
            {video.description && (
              <DialogDescription className="text-sm">
                {video.description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {availableFormats.length > 0 ? (
            <VideoPlayer
              formats={availableFormats}
              poster={video.thumbnail?.publicUrl}
            />
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
              <span className="text-muted-foreground">
                Video not available yet
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Uploaded{" "}
              {new Date(video.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

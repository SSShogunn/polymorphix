import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayerDialog } from "@/components/VideoPlayerDialog";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { fileManagementAPI, videosAPI, type Video } from "@/lib/api";

type UploadFormData = {
  title: string;
  description: string;
  file: FileList;
};

const MAX_SIZE_MB = 2048;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; 

export default function Home() {
  const { signOut } = useAuth();
  const { register, handleSubmit, reset } = useForm<UploadFormData>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const fetchVideos = async () => {
    try {
      const res = await videosAPI.getVideos();
      setVideos(res.data);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onSubmit = async (data: UploadFormData) => {
    const file = data.file[0];
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB allowed`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("file", file);

      const fileSize = file.size;
      await fileManagementAPI.uploadFile(formData, {
        onUploadProgress: (loaded, total) => {
          const totalBytes = total != null && total > 0 ? total : fileSize;
          if (totalBytes > 0) {
            setUploadProgress(Math.min(100, Math.round((loaded / totalBytes) * 100)));
          }
        },
      });
      toast.success("Video uploaded successfully");
      setUploadDialogOpen(false);
      reset();
      await fetchVideos();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Delete this video? This cannot be undone.")) return;
    setDeletingId(videoId);
    try {
      await videosAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all your videos? This cannot be undone.")) return;
    setDeletingAll(true);
    try {
      await videosAPI.deleteAllVideos();
      await fetchVideos();
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Polymorphix</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8 space-y-8">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog
            open={uploadDialogOpen}
            onOpenChange={(open) => {
              setUploadDialogOpen(open);
              if (!open) setUploadProgress(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" disabled={uploading}>
                {uploading ? "Uploading…" : "Upload Video"}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Video</DialogTitle>
                <DialogDescription>
                  Upload a video to your account
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-6 mt-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter video title"
                    {...register("title", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    className="resize-none"
                    {...register("description", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-file">Video File</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    {...register("file", { required: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select a video file to upload
                  </p>
                </div>

                {uploading && (
                  <div className="space-y-2 py-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Uploading…</span>
                      <span>{uploadProgress != null ? `${uploadProgress}%` : "0%"}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary transition-[width] duration-200 ease-out min-w-[2%]"
                        style={{ width: `${uploadProgress ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload Video"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {videos.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll ? "Deleting…" : "Delete all videos"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No videos yet. Upload one to get started.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
                onDelete={() => handleDeleteVideo(video.id)}
                deleting={deletingId === video.id}
              />
            ))}
          </div>
        )}
      </main>

      <VideoPlayerDialog
        video={selectedVideo}
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      />
    </div>
  );
}

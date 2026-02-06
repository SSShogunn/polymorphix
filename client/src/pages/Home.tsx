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
import { fileManagementAPI, videosAPI, type Video } from "@/lib/api";

type UploadFormData = {
  title: string;
  description: string;
  file: FileList;
};

export default function Home() {
  const { signOut } = useAuth();
  const { register, handleSubmit, reset } = useForm<UploadFormData>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("file", data.file[0]);

      await fileManagementAPI.uploadFile(formData);
      reset();
      await fetchVideos();
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all your videos? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await videosAPI.deleteAllVideos();
      await fetchVideos();
    } finally {
      setDeleting(false);
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
          <Dialog>
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
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete all videos"}
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

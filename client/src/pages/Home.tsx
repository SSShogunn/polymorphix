import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { EditVideoDialog, type EditFormData } from "@/components/EditVideoDialog";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { fileManagementAPI, videosAPI, type Video } from "@/lib/api";
import { Upload, Trash2, Video as VideoIcon, Search } from "lucide-react";

const DEBOUNCE_MS = 300;
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
] as const;
type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];

type UploadFormData = {
  title: string;
  description: string;
  file: FileList;
};

const MAX_SIZE_MB = 2048;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; 

export default function Home() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm<UploadFormData>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const fetchVideos = async (params?: { q?: string; status?: string }) => {
    try {
      const res = await videosAPI.getVideos({
        q: params?.q ?? (debouncedSearch || undefined),
        status: params?.status ?? (statusFilter === "all" ? undefined : statusFilter),
      });
      setVideos(res.data);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [debouncedSearch, statusFilter]);

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

  const handleVideoClick = (video: Video) => {
    navigate(`/watch?v=${video.id}`);
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setEditDialogOpen(true);
  };

  const handleUpdateVideo = async (data: EditFormData) => {
    if (!editingVideo) return;
    
    setUpdating(true);
    try {
      await videosAPI.updateVideo(editingVideo.id, {
        title: data.title,
        description: data.description,
      });
      toast.success("Video updated successfully");
      setEditDialogOpen(false);
      setEditingVideo(null);
      await fetchVideos();
    } catch (error) {
      toast.error("Failed to update video");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-primary-foreground">
              <VideoIcon className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Polymorphix</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">  
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Videos</h2>
            <p className="text-muted-foreground mt-1">
              {videos.length === 0
                ? "Upload your first video to get started"
                : `${videos.length} video${videos.length === 1 ? "" : "s"} in your library`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog
              open={uploadDialogOpen}
              onOpenChange={(open) => {
                setUploadDialogOpen(open);
                if (!open) setUploadProgress(null);
              }}
            >
              <DialogTrigger asChild>
                <Button disabled={uploading} size="lg" className="gap-2">
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : "Upload Video"}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Upload Video</DialogTitle>
                  <DialogDescription>
                    Share your video with the world
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-5 mt-2" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="My awesome video"
                      {...register("title", { required: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      className="resize-none"
                      placeholder="Tell viewers about your video..."
                      {...register("description", { required: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-file" className="text-sm font-medium">
                      Video File
                    </Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/*"
                      {...register("file", { required: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max file size: {MAX_SIZE_MB}MB
                    </p>
                  </div>

                  {uploading && (
                    <div className="space-y-2 py-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Uploading...</span>
                        <span className="text-primary">
                          {uploadProgress != null ? `${uploadProgress}%` : "0%"}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="submit" disabled={uploading} className="w-full gap-2">
                      <Upload className="size-4" />
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
                size="lg"
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {deletingAll ? "Deleting…" : "Delete All"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search videos"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                variant={statusFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-4">
              <Spinner className="size-10 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading your videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="flex items-center justify-center size-20 rounded-full bg-muted mb-6">
              <VideoIcon className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start building your video library by uploading your first video
            </p>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Upload className="size-4" />
              Upload Your First Video
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video)}
                onEdit={() => handleEditVideo(video)}
                onDelete={() => handleDeleteVideo(video.id)}
                deleting={deletingId === video.id}
              />
            ))}
          </div>
        )}
      </main>

      {editingVideo && (
        <EditVideoDialog
          video={editingVideo}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingVideo(null);
          }}
          onSubmit={handleUpdateVideo}
          isSubmitting={updating}
        />
      )}
    </div>
  );
}

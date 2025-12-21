import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { fileManagementAPI, type FileUploadData } from "@/lib/api";

type UploadFormData = {
  title: string;
  description: string;
  file: FileList;
};

export default function Home() {
  const { signOut } = useAuth();

  const { register, handleSubmit, reset } = useForm<FileUploadData>();

  const uploadFile = async (data: FileUploadData ) => {
    console.log(data.file)
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.file && data.file instanceof File) {
      formData.append("file", data.file);
    } else if (data.file && (data.file as any).length > 0) {
      formData.append("file", data.file[0]);
    }

    await fileManagementAPI.uploadFile({
      title: data.title,
      description: data.description,
      file: (data.file instanceof File ? data.file : data.file[0]),
    });

    reset(); // clear form after success
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

      <main className="container mx-auto p-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Upload Video</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Video</DialogTitle>
              <DialogDescription>
                Upload a video to your account
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-6 mt-4"
              onSubmit={handleSubmit(uploadFile)}
            >
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
                <Button type="submit">Upload Video</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

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
import axios from "axios";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

type UploadFormData = {
  title: string;
  description: string;
  file: FileList;
};

export default function Home() {
  const { signOut } = useAuth();
  const { register, handleSubmit, reset } = useForm<UploadFormData>();

  const onSubmit = async (data: UploadFormData) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("file", data.file[0]);

    const res = await axios.post(
      "http://localhost:8000/video/upload",
      formData
    );

    console.log(res.data);
    reset();
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
                <Button type="submit">Upload Video</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Video } from "@/lib/api";

interface EditVideoDialogProps {
  video: Video;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditFormData) => Promise<void>;
  isSubmitting: boolean;
}

export interface EditFormData {
  title: string;
  description: string;
}

export function EditVideoDialog({
  video,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EditVideoDialogProps) {
  const { register, handleSubmit, reset } = useForm<EditFormData>({
    defaultValues: {
      title: video.title,
      description: video.description || "",
    },
  });

  const handleFormSubmit = async (data: EditFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          reset({
            title: video.title,
            description: video.description || "",
          });
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Video</DialogTitle>
          <DialogDescription>
            Update your video title and description
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5 mt-2" onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="edit-title"
              placeholder="My awesome video"
              {...register("title", { required: true, maxLength: 255 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="edit-description"
              rows={4}
              className="resize-none"
              placeholder="Tell viewers about your video..."
              {...register("description", { maxLength: 2000 })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Pencil className="size-4" />
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

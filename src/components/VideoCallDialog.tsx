import { useMemo } from "react";
import { Copy, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function videoRoomName(consultationId: string) {
  return `SmartDispensaryThapar-${consultationId.replace(/-/g, "").slice(0, 16)}`;
}

export function videoRoomUrl(consultationId: string) {
  return `https://meet.jit.si/${videoRoomName(consultationId)}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultationId: string;
  displayName?: string | undefined;
  doctorName?: string | undefined;
};

export function VideoCallDialog({
  open,
  onOpenChange,
  consultationId,
  displayName,
  doctorName,
}: Props) {
  const src = useMemo(() => {
    const url = new URL(videoRoomUrl(consultationId));
    url.searchParams.set("config.prejoinPageEnabled", "false");
    if (displayName) url.hash = `userInfo.displayName="${encodeURIComponent(displayName)}"`;
    return url.toString();
  }, [consultationId, displayName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="size-4 text-primary" />
            Video consultation {doctorName ? `with ${doctorName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Allow camera and microphone access. Share the room link with your doctor if they have not
            joined yet.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
          {open && (
            <iframe
              title="Video consultation"
              src={src}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="size-full"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(videoRoomUrl(consultationId));
              toast.success("Room link copied");
            }}
          >
            <Copy className="mr-2 size-4" /> Copy room link
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={videoRoomUrl(consultationId)} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" /> Open in new tab
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

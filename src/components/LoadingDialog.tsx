import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface LoadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoadingDialog({ open, onOpenChange }: LoadingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-foreground">Loading Backend Services</DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-foreground/90">
              This demo is hosted on Render's free tier. The backend may take up to 50 seconds to wake up from sleep.
            </p>
            <p className="text-sm text-muted-foreground">
              Note: Free tier services automatically spin down after 15 minutes of inactivity.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

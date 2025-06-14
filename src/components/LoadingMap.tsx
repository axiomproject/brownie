import { motion } from "framer-motion";

export default function LoadingMap() {
  return (
    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin" />
        <p className="text-muted-foreground mt-4">Loading map...</p>
      </div>
    </div>
  );
}

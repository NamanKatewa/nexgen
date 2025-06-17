"use client";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Box } from "lucide-react";

const Tracking = () => {
  return (
    <div className="flex items-center justify-center pt-16 pb-8">
      <Input
        type="text"
        placeholder="Enter Tracking Number"
        aria-label="Tracking Number"
        className="w-1/2 rounded-r-none border-2 border-blue-200 border-r-0 focus:ring-blue-100/50 focus-visible:ring-blue-100/50"
      />
      <Button
        aria-label="Track Package"
        className="cursor-pointer rounded-l-none bg-blue-500/70 text-blue-950 hover:bg-blue-500/90"
      >
        Track
        <Box className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default Tracking;

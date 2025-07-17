"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";

interface CopyableIdProps {
  id: string;
}

const CopyableId: React.FC<CopyableIdProps> = ({ id }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy ID: ", err);
      toast.error("Failed to copy ID.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="max-w-[200px] overflow-x-auto whitespace-nowrap text-ellipsis"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hide scrollbar for Webkit browsers */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {id}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-6 w-6 p-0"
        aria-label="Copy ID"
      >
        <CopyIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CopyableId;

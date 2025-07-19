"use client";

import { CopyIcon } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

interface CopyableIdProps {
	content: string;
}

const Copyable: React.FC<CopyableIdProps> = ({ content }) => {
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			toast.success("Copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy: ", err);
			toast.error("Failed to copy");
		}
	};

	return (
		<div className="flex items-center gap-2">
			<div
				className="max-w-[200px] overflow-x-auto text-ellipsis whitespace-nowrap"
				style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
			>
				<style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
				{content}
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

export default Copyable;

"use client";

import { Box } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const Tracking = () => {
	const [trackingId, setTrackingId] = useState("");

	const handleTrack = () => {
		if (trackingId) {
			window.open(`/track/${trackingId}`, "_blank");
		}
	};

	return (
		<div className="flex items-center justify-center pt-16 pb-8">
			<Input
				type="text"
				placeholder="Enter Tracking Num"
				className=" w-1/2 rounded-r-none border-2 border-blue-200 border-r-0 focus:ring-blue-100/50 focus-visible:ring-blue-100/50"
				value={trackingId}
				onChange={(e) => setTrackingId(e.target.value)}
			/>
			<Button
				className="cursor-pointer rounded-l-none bg-blue-500/70 text-blue-950 hover:bg-blue-500/90"
				onClick={handleTrack}
			>
				Track
				<Box className="h-50 w-50" />
			</Button>
		</div>
	);
};

export default Tracking;

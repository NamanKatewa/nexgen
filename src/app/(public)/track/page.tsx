"use client";

import { Box } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const Tracking = () => {
	const [trackingId, setTrackingId] = useState("");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus the input when component mounts
		inputRef.current?.focus();
	}, []);

	const handleTrack = () => {
		if (trackingId) {
			router.push(`/track/${trackingId}`);
		}
	};

	return (
		<div className="flex h-screen w-full items-center justify-evenly p-40">
			<div className="flex w-full flex-col gap-8">
				<Input
					ref={inputRef}
					type="text"
					placeholder="Enter AWB / Shipment ID"
					className=" w-1/2 border-2 border-blue-200 focus:ring-blue-100/50 focus-visible:ring-blue-100/50"
					value={trackingId}
					onChange={(e) => setTrackingId(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleTrack();
						}
					}}
				/>
				<Button
					className="w-1/2 cursor-pointer bg-blue-500/70 text-blue-950 hover:bg-blue-500/90"
					onClick={handleTrack}
				>
					Track
					<Box className="h-50 w-50" />
				</Button>
			</div>
			<Image src="/logo.png" alt="Logo" width={500} height={500} />
		</div>
	);
};

export default Tracking;

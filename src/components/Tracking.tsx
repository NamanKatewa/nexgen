import { Box } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const Tracking = () => {
	return (
		<div className="flex items-center justify-center pt-16 pb-8">
			<Input
				type="text"
				placeholder="Enter Tracking Num"
				className=" w-1/2 rounded-r-none border-2 border-blue-200 border-r-0 focus:ring-blue-100/50 focus-visible:ring-blue-100/50"
			/>
			<Button className="cursor-pointer rounded-l-none bg-blue-500/70 text-blue-950 hover:bg-blue-500/90">
				Track
				<Box className="h-50 w-50" />
			</Button>
		</div>
	);
};

export default Tracking;

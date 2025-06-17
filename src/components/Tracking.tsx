import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Box } from "lucide-react";

const Tracking = () => {
  return (
    <div className="flex items-center justify-center pt-16 pb-8">
      <Input
        type="text"
        placeholder="Enter Tracking Num"
        className=" w-1/2 focus:ring-blue-100/50 focus-visible:ring-blue-100/50 rounded-r-none border-2 border-blue-200 border-r-0"
      />
      <Button className="bg-blue-500/70 text-blue-950 cursor-pointer hover:bg-blue-500/90 rounded-l-none">
        Track
        <Box className="w-50 h-50" />
      </Button>
    </div>
  );
};

export default Tracking;

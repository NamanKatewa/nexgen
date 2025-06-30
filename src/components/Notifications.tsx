"use client";

import { AnimatedList } from "~/components/magicui/animated-list";
import { cn } from "~/lib/utils";

interface Item {
	name: string;
	message: string;
	icon: string;
	time: string;
}

const notifications = [
	{
		name: "Delhivery",
		message: "Shipment created and awaiting pickup.",
		time: "30m ago",
		icon: "📝",
	},
	{
		name: "Delhivery",
		message: "Package picked up by the agent.",
		time: "20m ago",
		icon: "📦",
	},
	{
		name: "Delhivery",
		message: "In transit to the destination hub.",
		time: "10m ago",
		icon: "🚛",
	},
	{
		name: "XpressBees",
		message: "Order has been packed at seller warehouse.",
		time: "45m ago",
		icon: "🎁",
	},
	{
		name: "XpressBees",
		message: "Dispatched from origin facility.",
		time: "25m ago",
		icon: "📤",
	},
	{
		name: "XpressBees",
		message: "Arrived at destination city hub.",
		time: "8m ago",
		icon: "📍",
	},
	{
		name: "Shadowfax",
		message: "Agent assigned for pickup.",
		time: "50m ago",
		icon: "👤",
	},
	{
		name: "Shadowfax",
		message: "Order picked up and scanned.",
		time: "30m ago",
		icon: "🔄",
	},
	{
		name: "Shadowfax",
		message: "Out for delivery.",
		time: "3m ago",
		icon: "🏃‍♂️",
	},
	{
		name: "Amazon Shipping",
		message: "Shipping label generated.",
		time: "1h ago",
		icon: "🖨️",
	},
	{
		name: "Amazon Shipping",
		message: "Package picked up from seller.",
		time: "35m ago",
		icon: "📦",
	},
	{
		name: "Amazon Shipping",
		message: "Shipped via Amazon Transport.",
		time: "15m ago",
		icon: "🚚",
	},
	{
		name: "Amazon Shipping",
		message: "Delivered to customer.",
		time: "Just now",
		icon: "📬",
	},
	{
		name: "Ecom Express",
		message: "Order confirmed by seller.",
		time: "1h 10m ago",
		icon: "✅",
	},
	{
		name: "Ecom Express",
		message: "Parcel handed over to courier.",
		time: "50m ago",
		icon: "🙌",
	},
	{
		name: "Ecom Express",
		message: "On the way to delivery hub.",
		time: "15m ago",
		icon: "🛣️",
	},
	{
		name: "Ecom Express",
		message: "Delivered successfully.",
		time: "2m ago",
		icon: "✅",
	},
];

const Notification = ({ name, message, icon, time }: Item) => {
	return (
		<figure
			className={cn(
				"relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-xl p-4",
				"transition-all duration-200 ease-in-out hover:bg-white/10 dark:hover:bg-gray-800/30",
				"bg-white/5 dark:bg-gray-900/5",
				"border-gray-200/10 border-b dark:border-gray-700/10",
			)}
		>
			<div className="flex flex-row items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-full bg-blue-400/40 backdrop-blur-sm">
					<span className="text-2xl">{icon}</span>
				</div>
				<div className="flex flex-grow flex-col overflow-hidden">
					<figcaption className="flex flex-row items-center justify-between whitespace-pre font-medium text-blue-950 text-lg">
						<span className="text-sm sm:text-lg">{name}</span>
						<span className="text-blue-950 text-xs">{time}</span>
					</figcaption>
					<p className="truncate font-normal text-blue-950 text-sm">
						{message}
					</p>
				</div>
			</div>
		</figure>
	);
};

const Notifications = ({ className }: { className?: string }) => {
	return (
		<div
			className={cn(
				"relative flex h-[500px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl md:shadow-xl",
				"bg-gradient-to-br from-orange/10 to-orange/30",
				"backdrop-blur-md backdrop-saturate-150",
				"border border-white/20 dark:border-gray-800/20",
				className,
			)}
		>
			<div className="bg-blue-400/80 p-4 text-blue-950 backdrop-blur-sm dark:text-white">
				<h2 className="font-semibold text-lg">Courier Updates</h2>
			</div>
			<div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 flex-grow overflow-y-auto">
				<AnimatedList>
					{notifications.map((item, idx) => (
						<Notification {...item} key={`${item.name}-${item.message}`} />
					))}
				</AnimatedList>
			</div>
		</div>
	);
};

export default Notifications;

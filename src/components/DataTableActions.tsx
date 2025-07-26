"use client";
import { MoreHorizontal } from "lucide-react";
import { nanoid } from "nanoid";
import type { FC } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

export interface Action {
	label: string;
	onClick: () => void;
}

interface DataTableActionsProps {
	actions: Action[];
}

const DataTableActions: FC<DataTableActionsProps> = ({ actions }) => {
	return (
		<>
			{actions.length > 0 && (
				<Popover>
					<PopoverTrigger asChild>
						<Button className="h-8 w-8 rounded-full p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-40 rounded-2xl p-2">
						<div className="grid gap-2">
							{actions.map((action) => (
								<Button
									key={nanoid()}
									onClick={action.onClick}
									className="w-full"
								>
									{action.label}
								</Button>
							))}
						</div>
					</PopoverContent>
				</Popover>
			)}
		</>
	);
};

export { DataTableActions };

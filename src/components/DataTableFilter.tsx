import type React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

interface FilterOption {
	label: string;
	value: string;
}

interface DataTableFilterProps {
	id: string;
	label: string;
	options: FilterOption[];
	selectedValue: string;
	onValueChange: (value: string) => void;
}

const DataTableFilter: React.FC<DataTableFilterProps> = ({
	id,
	label,
	options,
	selectedValue,
	onValueChange,
}) => {
	return (
		<div className="flex items-center gap-2">
			<label htmlFor={id} className="text-blue-950 text-sm">
				{label}:
			</label>
			<Select value={selectedValue} onValueChange={onValueChange}>
				<SelectTrigger id={id} className="w-[240px] text-blue-950">
					<SelectValue placeholder={label} />
				</SelectTrigger>
				<SelectContent className="text-blue-950">
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export { DataTableFilter };

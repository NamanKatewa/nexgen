import type React from "react";
import { Input } from "~/components/ui/input";
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
	type?: "select" | "text";
	options?: FilterOption[];
	selectedValue?: string;
	onValueChange?: (value: string) => void;
	value?: string;
	onChange?: (value: string) => void;
}

const DataTableFilter: React.FC<DataTableFilterProps> = ({
	id,
	label,
	type = "select",
	options,
	selectedValue,
	onValueChange,
	value,
	onChange,
}) => {
	return (
		<div className="flex items-center gap-2">
			<label htmlFor={id} className="text-blue-950 text-sm">
				{label}:
			</label>
			{type === "select" && options && selectedValue && onValueChange && (
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
			)}
			{type === "text" && value !== undefined && onChange && (
				<Input
					id={id}
					type="text"
					placeholder={`Filter by ${label.toLowerCase()}...`}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-[240px] text-blue-950"
				/>
			)}
		</div>
	);
};

export { DataTableFilter };

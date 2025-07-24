import { Button } from "~/components/ui/button";
import { Skeleton } from "./ui/skeleton";

interface PaginationButtonsProps {
	isLoading: boolean;
	page: number;
	totalPages: number;
	setPage: (page: number) => void;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({
	isLoading,
	page,
	totalPages,
	setPage,
}) => {
	if (isLoading)
		return (
			<div className="flex w-full items-center justify-between space-x-2 px-20 pt-10">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setPage(Math.max(page - 1, 1))}
					disabled={true}
				>
					Previous
				</Button>
				<Skeleton className="h-6 w-40" />
				<Button
					variant="outline"
					size="sm"
					onClick={() => setPage(page + 1)}
					disabled={true}
				>
					Next
				</Button>
			</div>
		);
	return (
		<div className="flex w-full items-center justify-between space-x-2 px-20 pt-10">
			<Button
				variant="outline"
				size="sm"
				onClick={() => setPage(Math.max(page - 1, 1))}
				disabled={page === 1}
			>
				Previous
			</Button>
			<span className="font-medium text-sm">
				Page {page} of {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setPage(page + 1)}
				disabled={page === totalPages}
			>
				Next
			</Button>
		</div>
	);
};

export default PaginationButtons;

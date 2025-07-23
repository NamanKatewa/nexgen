import { Button } from "~/components/ui/button";

interface PaginationButtonsProps {
	page: number;
	totalPages: number;
	setPage: (page: number) => void;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({
	page,
	totalPages,
	setPage,
}) => {
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

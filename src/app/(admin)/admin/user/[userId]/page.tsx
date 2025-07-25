"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Copyable from "~/components/Copyable";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AdminUserDetailPage() {
	const utils = api.useUtils();
	const params = useParams();
	const userId = params.userId as string;

	const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

	const addFundsSchema = z.object({
		amount: z.number().min(1, "Amount must be at least 1"),
		description: z.string().min(1, "Description is required"),
	});

	type AddFundsInput = z.infer<typeof addFundsSchema>;

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<AddFundsInput>({
		resolver: zodResolver(addFundsSchema),
	});

	const addFundsMutation = api.wallet.addFundsToWallet.useMutation({
		onSuccess: () => {
			utils.admin.getUserById.invalidate();
			toast.success("Funds added successfully!");
			setIsAddFundsModalOpen(false);
			reset();
		},
		onError: (err) => {
			toast.error(`Error adding funds: ${err.message}`);
		},
	});

	const onSubmitAddFunds = (data: AddFundsInput) => {
		addFundsMutation.mutate({
			userId,
			amount: data.amount,
			description: data.description,
		});
	};

	const {
		data: user,
		isLoading,
		error,
	} = api.admin.getUserById.useQuery({
		userId,
	});

	if (isLoading) {
		return (
			<div className="p-8">
				<Skeleton className="mb-6 h-8 w-1/2" />
				<Skeleton className="my-4 h-10 w-full" />

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-1/4" />
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							{[...Array(12)].map(() => (
								<Fragment key={nanoid()}>
									<Skeleton className="h-5 w-1/3" />
									<Skeleton className="h-5 w-2/3" />
								</Fragment>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-1/4" />
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							{[...Array(8)].map(() => (
								<Fragment key={nanoid()}>
									<Skeleton className="h-5 w-1/3" />
									<Skeleton className="h-5 w-2/3" />
								</Fragment>
							))}
						</div>
						<div className="mt-4 grid grid-cols-2 gap-4">
							<div>
								<Skeleton className="mb-2 h-4 w-1/2" />
								<div className="flex gap-4">
									<Skeleton className="h-48 w-48" />
									<Skeleton className="h-48 w-48" />
								</div>
							</div>
							<div>
								<Skeleton className="mb-2 h-4 w-1/2" />
								<div className="flex gap-4">
									<Skeleton className="h-48 w-48" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{[...Array(3)].map(() => (
					<Card key={nanoid()} className="mb-6">
						<CardHeader>
							<CardTitle>
								<Skeleton className="h-6 w-1/4" />
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{[...Array(2)].map(() => (
								<div
									key={nanoid()}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										{[...Array(5)].map(() => (
											<Fragment key={nanoid()}>
												<Skeleton className="h-5 w-1/3" />
												<Skeleton className="h-5 w-2/3" />
											</Fragment>
										))}
									</div>
								</div>
							))}
							<Skeleton className="h-10 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return <div className="p-8 text-red-500">Error: {error.message}</div>;
	}

	if (!user) {
		return <div className="p-8">User not found.</div>;
	}

	return (
		<>
			<div className="p-8">
				<h1 className="mb-6 font-bold text-3xl">User Details - {user.name}</h1>
				<div className="my-4 flex flex-col gap-2">
					<Button className="w-full">
						<Link href={`/admin/rates/${user.user_id}`}>Edit Rates</Link>
					</Button>
					<Button
						className="w-full"
						onClick={() => setIsAddFundsModalOpen(true)}
					>
						Add Funds
					</Button>
				</div>
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>User Profile</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							<p className="font-medium text-sm">User ID:</p>
							<Copyable content={user.user_id} />

							<p className="font-medium text-sm">Name:</p>
							<p className="text-sm">{user.name}</p>

							<p className="font-medium text-sm">Email:</p>
							<p className="text-sm">{user.email}</p>

							<p className="font-medium text-sm">Mobile Number:</p>
							<p className="text-sm">{user.mobile_number}</p>

							<p className="font-medium text-sm">Company Name:</p>
							<p className="text-sm">{user.company_name || "N/A"}</p>

							<p className="font-medium text-sm">Monthly Order:</p>
							<p className="text-sm">{user.monthly_order || "N/A"}</p>

							<p className="font-medium text-sm">Business Type:</p>
							<Badge
								className={cn("w-fit text-blue-950", {
									"bg-green-200": user.business_type === "Ecommerce",
									"bg-yellow-200": user.business_type === "Retailer",
									"bg-purple-200": user.business_type === "Franchise",
								})}
							>
								{user.business_type}
							</Badge>

							<p className="font-medium text-sm">Role:</p>
							<Badge
								className={cn("w-fit text-blue-950", {
									"bg-green-200": user.role === "Admin",
									"bg-yellow-200": user.role === "Employee",
									"bg-blue-200": user.role === "Client",
								})}
							>
								{user.role}
							</Badge>

							<p className="font-medium text-sm">Status:</p>
							<Badge
								className={cn("w-fit text-blue-950", {
									"bg-green-200": user.status === "Active",
									"bg-red-200": user.status === "Inactive",
								})}
							>
								{user.status}
							</Badge>

							<p className="font-medium text-sm">Created At:</p>
							<p className="text-sm">{formatDate(user.created_at)}</p>
						</div>
					</CardContent>
				</Card>

				{user.kyc && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>KYC Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<p className="font-medium text-sm">KYC ID:</p>
								<Copyable content={user.kyc.kyc_id} />

								<p className="font-medium text-sm">Entity Name:</p>
								<p className="text-sm">{user.kyc.entity_name || "N/A"}</p>

								<p className="font-medium text-sm">Entity Type:</p>
								<p className="text-sm">{user.kyc.entity_type || "N/A"}</p>

								<p className="font-medium text-sm">Website URL:</p>
								<p className="text-sm">{user.kyc.website_url || "N/A"}</p>

								<p className="font-medium text-sm">Aadhar Number:</p>
								<p className="text-sm">{user.kyc.aadhar_number || "N/A"}</p>

								<p className="font-medium text-sm">PAN Number:</p>
								<p className="text-sm">{user.kyc.pan_number || "N/A"}</p>

								<p className="font-medium text-sm">GST Registered:</p>
								<Badge>{user.kyc.gst ? "Yes" : "No"}</Badge>

								<p className="font-medium text-sm">KYC Status:</p>
								<Badge
									className={cn("w-fit text-blue-950", {
										"bg-green-200": user.kyc.kyc_status === "Approved",
										"bg-yellow-200": user.kyc.kyc_status === "Submitted",
										"bg-red-200": user.kyc.kyc_status === "Rejected",
										"bg-gray-200": user.kyc.kyc_status === "Pending",
									})}
								>
									{user.kyc.kyc_status}
								</Badge>

								<p className="font-medium text-sm">Submission Date:</p>
								<p className="text-sm">
									{user.kyc.submission_date
										? formatDate(user.kyc.submission_date)
										: "N/A"}
								</p>

								<p className="font-medium text-sm">Verification Date:</p>
								<p className="text-sm">
									{user.kyc.verification_date
										? formatDate(user.kyc.verification_date)
										: "N/A"}
								</p>

								{user.kyc.rejection_reason && (
									<>
										<p className="font-medium text-sm">Rejection Reason:</p>
										<p className="text-red-500 text-sm">
											{user.kyc.rejection_reason || "N/A"}
										</p>
									</>
								)}
							</div>
							<div className="mt-4 grid grid-cols-2 gap-4">
								<div>
									<p className="mb-2 font-medium text-sm">Aadhar Images:</p>
									<div className="flex gap-4">
										{user.kyc.aadhar_image_front && (
											<Link
												href={user.kyc.aadhar_image_front}
												target="_blank"
												rel="noopener noreferrer"
											>
												<img
													src={user.kyc.aadhar_image_front}
													alt="Aadhar Front"
													className="h-48 w-48 rounded-md object-cover"
												/>
											</Link>
										)}
										{user.kyc.aadhar_image_back && (
											<Link
												href={user.kyc.aadhar_image_back}
												target="_blank"
												rel="noopener noreferrer"
											>
												<img
													src={user.kyc.aadhar_image_back}
													alt="Aadhar Back"
													className="h-48 w-48 rounded-md object-cover"
												/>
											</Link>
										)}
									</div>
								</div>
								<div>
									<p className="mb-2 font-medium text-sm">PAN Images:</p>
									<div className="flex gap-4">
										{user.kyc.pan_image_front && (
											<Link
												href={user.kyc.pan_image_front}
												target="_blank"
												rel="noopener noreferrer"
											>
												<img
													src={user.kyc.pan_image_front}
													alt="PAN Front"
													className="h-48 w-48 rounded-md object-cover"
												/>
											</Link>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{user.wallet && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Wallet Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<p className="font-medium text-sm">Wallet ID:</p>
								<Copyable content={user.wallet.wallet_id} />

								<p className="font-medium text-sm">Balance:</p>
								<p
									className={cn("text-sm", {
										"text-red-500": Number(user.wallet.balance) < 0,
										"text-green-500": Number(user.wallet.balance) >= 0,
									})}
								>
									₹ {Number(user.wallet.balance).toFixed(2)}
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{user.addresses.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Addresses</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.addresses.map((address) => (
								<div
									key={address.address_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Address ID:</p>
										<p className="text-sm">{address.address_id}</p>

										<p className="font-medium text-sm">Name:</p>
										<p className="text-sm">{address.name}</p>

										<p className="font-medium text-sm">Address Line:</p>
										<p className="text-sm">{address.address_line}</p>

										{address.landmark && (
											<>
												<p className="font-medium text-sm">Landmark:</p>
												<p className="text-sm">{address.landmark}</p>
											</>
										)}

										<p className="font-medium text-sm">City:</p>
										<p className="text-sm">{address.city}</p>

										<p className="font-medium text-sm">State:</p>
										<p className="text-sm">{address.state}</p>

										<p className="font-medium text-sm">Zip Code:</p>
										<p className="text-sm">{address.zip_code}</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				)}

				{user.shipments.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Shipments</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.shipments.slice(0, 2).map((shipment) => (
								<div
									key={shipment.shipment_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Shipment ID:</p>
										<Link href={`/admin/shipments/${shipment.shipment_id}`}>
											<p className="text-sm">
												{shipment.human_readable_shipment_id}
											</p>
										</Link>

										<p className="font-medium text-sm">Status:</p>
										<Badge
											className={cn("w-fit text-blue-950", {
												"bg-green-200": shipment.shipment_status === "Approved",
												"bg-yellow-200":
													shipment.shipment_status === "PendingApproval",
												"bg-red-200": shipment.shipment_status === "Rejected",
											})}
										>
											{shipment.shipment_status}
										</Badge>

										<p className="font-medium text-sm">Shipping Cost:</p>
										<p className="text-sm">
											₹{Number(shipment.shipping_cost).toFixed(2)}
										</p>

										<p className="font-medium text-sm">Created At:</p>
										<p className="text-sm">{formatDate(shipment.created_at)}</p>
									</div>
								</div>
							))}

							<Link href={`/admin/shipments?userId=${user.user_id}`}>
								<Button className="w-full">View User Shipments</Button>
							</Link>
						</CardContent>
					</Card>
				)}

				{user.transactions.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Transactions</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.transactions.slice(0, 2).map((transaction) => (
								<div
									key={transaction.transaction_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Transaction ID:</p>
										<p className="text-sm">{transaction.transaction_id}</p>

										<p className="font-medium text-sm">Type:</p>
										<Badge
											className={cn("w-fit text-blue-950", {
												"bg-red-200": transaction.transaction_type === "Debit",
												"bg-green-200":
													transaction.transaction_type === "Credit",
											})}
										>
											{transaction.transaction_type}
										</Badge>

										<p className="font-medium text-sm">Amount:</p>
										<p className="text-sm">
											₹{Number(transaction.amount).toFixed(2)}
										</p>

										<p className="font-medium text-sm">Payment Status:</p>
										<Badge
											className={cn("w-fit text-blue-950", {
												"bg-green-200":
													transaction.payment_status === "Completed",
												"bg-yellow-200":
													transaction.payment_status === "Pending",
												"bg-red-200": transaction.payment_status === "Failed",
											})}
										>
											{transaction.payment_status}
										</Badge>

										<p className="font-medium text-sm">Description:</p>
										<p className="text-sm">
											{transaction.description || "N/A"}
										</p>

										<p className="font-medium text-sm">Created At:</p>
										<p className="text-sm">
											{formatDate(transaction.created_at)}
										</p>
									</div>
								</div>
							))}

							<Link href={`/admin/passbook?userId=${user.user_id}`}>
								<Button className="w-full">View User Transactions</Button>
							</Link>
						</CardContent>
					</Card>
				)}

				{user.tickets.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Support Tickets</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.tickets.slice(0, 2).map((ticket) => (
								<div
									key={ticket.ticket_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Ticket ID:</p>
										<p className="text-sm">{ticket.ticket_id}</p>

										<p className="font-medium text-sm">Subject:</p>
										<p className="text-sm">{ticket.subject}</p>

										<p className="font-medium text-sm">Status:</p>
										<Badge
											className={cn("w-fit text-blue-950", {
												"bg-green-200": ticket.status === "Closed",
												"bg-yellow-200": ticket.status === "Open",
											})}
										>
											{ticket.status}
										</Badge>

										<p className="font-medium text-sm">Priority:</p>
										<Badge
											className={cn("w-fit text-blue-950", {
												"bg-green-200": ticket.priority === "Low",
												"bg-yellow-200": ticket.priority === "Medium",
												"bg-red-200": ticket.priority === "High",
											})}
										>
											{ticket.priority}
										</Badge>

										<p className="font-medium text-sm">Created At:</p>
										<p className="text-sm">{formatDate(ticket.created_at)}</p>
									</div>
								</div>
							))}

							<Link href={`/admin/support?userId=${user.user_id}`}>
								<Button className="w-full">View User Support Tickets</Button>
							</Link>
						</CardContent>
					</Card>
				)}

				{user.employee && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Employee Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<p className="font-medium text-sm">Employee ID:</p>
								<p className="text-sm">{user.employee.employee_id}</p>

								<p className="font-medium text-sm">Employee Code:</p>
								<p className="text-sm">{user.employee.employee_code}</p>

								<p className="font-medium text-sm">Designation:</p>
								<p className="text-sm">{user.employee.designation}</p>

								<p className="font-medium text-sm">Department:</p>
								<p className="text-sm">{user.employee.department}</p>

								<p className="font-medium text-sm">Hire Date:</p>
								<p className="text-sm">{formatDate(user.employee.hire_date)}</p>

								<p className="font-medium text-sm">Status:</p>
								<Badge
									className={cn("w-fit text-blue-950", {
										"bg-green-200": user.employee.status === "Active",
										"bg-red-200": user.employee.status === "Inactive",
									})}
								>
									{user.employee.status}
								</Badge>
							</div>
						</CardContent>
					</Card>
				)}

				{user.userRates.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>User Rates</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.userRates.slice(0, 2).map((rate) => (
								<div
									key={rate.user_rate_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Rate ID:</p>
										<p className="text-sm">{rate.user_rate_id}</p>

										<p className="font-medium text-sm">Zone From:</p>
										<p className="text-sm">{rate.zone_from}</p>

										<p className="font-medium text-sm">Zone To:</p>
										<p className="text-sm">{rate.zone_to}</p>

										<p className="font-medium text-sm">Weight Slab:</p>
										<p className="text-sm">{rate.weight_slab} Kg</p>

										<p className="font-medium text-sm">Rate:</p>
										<p className="text-sm">₹{Number(rate.rate).toFixed(2)}</p>

										<p className="font-medium text-sm">Created At:</p>
										<p className="text-sm">{formatDate(rate.created_at)}</p>
									</div>
								</div>
							))}

							<Link href={`/admin/rates?userId=${user.user_id}`}>
								<Button className="w-full">View User Rates</Button>
							</Link>
						</CardContent>
					</Card>
				)}

				{user.pendingAddresses.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Pending Addresses</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{user.pendingAddresses.slice(0, 2).map((pAddress) => (
								<div
									key={pAddress.pending_address_id}
									className="mb-4 border-b pb-4 last:mb-0 last:border-b-0 last:pb-0"
								>
									<div className="grid grid-cols-2 items-center gap-2">
										<p className="font-medium text-sm">Pending Address ID:</p>
										<p className="text-sm">{pAddress.pending_address_id}</p>

										<p className="font-medium text-sm">Name:</p>
										<p className="text-sm">{pAddress.name}</p>

										<p className="font-medium text-sm">Address Line:</p>
										<p className="text-sm">{pAddress.address_line}</p>

										{pAddress.landmark && (
											<>
												<p className="font-medium text-sm">Landmark:</p>
												<p className="text-sm">{pAddress.landmark}</p>
											</>
										)}

										<p className="font-medium text-sm">City:</p>
										<p className="text-sm">{pAddress.city}</p>

										<p className="font-medium text-sm">State:</p>
										<p className="text-sm">{pAddress.state}</p>

										<p className="font-medium text-sm">Zip Code:</p>
										<p className="text-sm">{pAddress.zip_code}</p>

										<p className="font-medium text-sm">Created At:</p>
										<p className="text-sm">{formatDate(pAddress.created_at)}</p>
									</div>
								</div>
							))}

							<Link href={`/admin/pending-addresses?userId=${user.user_id}`}>
								<Button className="w-full">View User Pending Addresses</Button>
							</Link>
						</CardContent>
					</Card>
				)}
			</div>

			<Dialog open={isAddFundsModalOpen} onOpenChange={setIsAddFundsModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Funds to Wallet</DialogTitle>
						<DialogDescription>
							Enter the amount and a description for the fund addition.
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={handleSubmit(onSubmitAddFunds)}
						className="grid gap-4 py-4"
					>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="amount" className="text-right">
								Amount
							</Label>
							<Input
								id="amount"
								type="number"
								{...register("amount", { valueAsNumber: true })}
								className="col-span-3"
							/>
							{errors.amount && (
								<p className="col-span-4 text-right text-red-500 text-sm">
									{errors.amount.message}
								</p>
							)}
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="description" className="text-right">
								Description
							</Label>
							<Textarea
								id="description"
								{...register("description")}
								className="col-span-3"
							/>
							{errors.description && (
								<p className="col-span-4 text-right text-red-500 text-sm">
									{errors.description.message}
								</p>
							)}
						</div>
						<DialogFooter>
							<Button type="submit" disabled={addFundsMutation.isPending}>
								{addFundsMutation.isPending ? "Adding..." : "Add Funds"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

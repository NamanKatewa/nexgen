"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	LayoutDashboard,
	LogIn,
	LogOut,
	Menu,
	Plus,
	RefreshCw,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientOnly } from "~/components/ClientOnly";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

const NavItems = ["Home", "Services", "Contact Us", "Track", "Rate Calculator"];

const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [amount, setAmount] = useState("");
	const addFunds = api.wallet.addFunds.useMutation();
	const checkPendingTxns = api.wallet.checkPendingTransactions.useMutation();
	const logoutMutation = api.auth.logout.useMutation();
	const router = useRouter();
	const [pathname, setPathname] = useState("/");

	useEffect(() => {
		if (typeof window !== "undefined") {
			setPathname(window.location.pathname);
		}
	}, []);

	const [isAuthenticatedOptimistic, setIsAuthenticatedOptimistic] =
		useState(false);

	useEffect(() => {
		const token =
			localStorage.getItem("token") || document.cookie.includes("token=");
		setIsAuthenticatedOptimistic(!!token);
	}, []);

	const { data: user, isLoading } = api.auth.me.useQuery(undefined, {
		retry: false,
		refetchInterval: 600000,
		enabled: isAuthenticatedOptimistic,
	});

	const utils = api.useUtils();
	const handleLogout = () => {
		logoutMutation.mutate();
		localStorage.removeItem("token");
		document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		setIsMobileMenuOpen(false);
		window.location.href = "/";
	};

	const getDashboardRoute = () => {
		if (!user) return "/";
		return user.role === "Admin" ? "/admin/dashboard" : "/dashboard";
	};

	const getInitials = (name?: string, email?: string) => {
		if (name?.trim()) {
			const initials = name
				.trim()
				.split(" ")
				.map((n) => n[0])
				.filter(Boolean)
				.join("")
				.toUpperCase();
			return initials.slice(0, 2) || "U";
		}
		if (email?.trim()) {
			return email.trim()[0]?.toUpperCase() || "U";
		}
		return "U";
	};

	useEffect(() => {
		if (user === null) {
			localStorage.removeItem("token");
			document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			router.push("/");
			router.refresh();
		}
	}, [user, router]);

	return (
		<>
			<motion.nav
				className="fixed top-0 left-0 z-50 w-full bg-blue-50 px-8 shadow-sm backdrop-blur-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				<div className="container mx-auto flex h-16 items-center justify-between lg:h-16 lg:px-4">
					<motion.div
						className="flex items-center text-blue-400 lg:order-1"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Link href="/">
							<Image src="/logo.png" height={40} width={80} alt="logo" />
						</Link>
					</motion.div>

					<div className="flex lg:hidden">
						<Button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							variant="ghost"
							size="icon"
							className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
						>
							<Menu className="h-5 w-5" />
						</Button>
					</div>

					<div className="hidden w-full lg:order-2 lg:flex lg:w-auto">
						{!pathname.startsWith("/admin") &&
							!pathname.startsWith("/dashboard") && (
								<ul className="flex justify-between font-medium text-slate-500">
									{NavItems.map((item) => (
										<motion.li
											key={item}
											className="lg:px-4 lg:py-2"
											whileHover={{ scale: 1.05, color: "#3B82F6" }}
											whileTap={{ scale: 0.95 }}
										>
											<Link
												href={
													item === "Home"
														? "/"
														: `/${item
																.toLowerCase()
																.replace(/ & /g, "-")
																.replace(/ /g, "-")}`
												}
												className="transition-colors duration-200 ease-in-out hover:text-blue-400"
												target={
													item === "Rate Calculator" || item === "Track"
														? "_blank"
														: undefined
												}
												rel={
													item === "Rate Calculator" || item === "Track"
														? "noopener noreferrer"
														: undefined
												}
											>
												{item}
											</Link>
										</motion.li>
									))}
								</ul>
							)}
					</div>

					<div className="hidden items-center gap-5 lg:order-3 lg:flex">
						<ClientOnly>
							{user || isAuthenticatedOptimistic ? (
								<>
									{user?.role === "Client" ? (
										<div className="flex items-center gap-2 text-blue-950">
											<Dialog
												open={isDialogOpen}
												onOpenChange={setIsDialogOpen}
											>
												<DialogTrigger asChild>
													<Button
														variant="outline"
														className="cursor-pointer bg-transparent hover:bg-blue-100"
													>
														<Plus className="h-4 w-4 text-blue-950" />
													</Button>
												</DialogTrigger>

												<DialogContent className="sm:max-w-md">
													<DialogHeader>
														<DialogTitle>Add Funds</DialogTitle>
													</DialogHeader>
													<div className="flex flex-col gap-4">
														<Input
															type="number"
															placeholder="Enter amount"
															value={amount}
															onChange={(e) => setAmount(e.target.value)}
															min={1}
														/>
													</div>
													<DialogFooter>
														<Button
															onClick={async () => {
																const amt = Number.parseFloat(amount);
																if (Number.isNaN(amt) || amt <= 0) return;

																try {
																	const res = await addFunds.mutateAsync({
																		amount: amt,
																	});

																	if (res?.paymentUrl) {
																		window.location.href = res.paymentUrl;
																	}
																} catch (err) {
																	console.error(err);
																} finally {
																	setIsDialogOpen(false);
																	setAmount("");
																}
															}}
															disabled={addFunds.isPending || !amount}
														>
															{addFunds.isPending
																? "Redirecting..."
																: "Pay Now"}
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
											₹{String(user.walletBalance)}
											<Wallet className="text-blue-950" />
											<Button
												variant="ghost"
												size="icon"
												onClick={async () => {
													await checkPendingTxns.mutateAsync();
													await utils.auth.me.invalidate();
													await utils.wallet.getPassbook.invalidate();
												}}
												disabled={checkPendingTxns.isPending}
												className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										</div>
									) : (
										<></>
									)}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												className="relative h-10 w-10 rounded-full"
											>
												<Avatar className="h-10 w-10">
													<AvatarFallback className="bg-blue-100 text-blue-600">
														{getInitials(user?.name, user?.email)}
													</AvatarFallback>
												</Avatar>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-56"
											align="end"
											forceMount
										>
											<DropdownMenuLabel className="font-normal">
												<div className="flex flex-col space-y-1">
													<p className="font-medium text-sm leading-none">
														{user?.name || "User"}
													</p>
													<p className="text-muted-foreground text-xs leading-none">
														{user?.email}
													</p>
												</div>
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => router.push(getDashboardRoute())}
											>
												<LayoutDashboard className="mr-2 h-4 w-4" />
												<span>Dashboard</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={handleLogout}>
												<LogOut className="mr-2 h-4 w-4 text-red-500" />
												<span className="text-red-500">Log out</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							) : (
								<div className="flex gap-2">
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Link href="/login">
											<Button
												variant="outline"
												className="flex cursor-pointer items-center gap-2 border-blue-200 text-blue-500 transition-colors duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-600"
												disabled={!user && isLoading}
											>
												<LogIn className="h-4 w-4" />
												<span>Login</span>
											</Button>
										</Link>
									</motion.div>
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Link href="/register">
											<Button
												variant="outline"
												className="flex cursor-pointer items-center gap-2 border-green-200 text-green-500 transition-colors duration-200 ease-in-out hover:bg-green-50 hover:text-green-600"
											>
												<Plus className="h-4 w-4" />
												<span>Sign Up</span>
											</Button>
										</Link>
									</motion.div>
								</div>
							)}
						</ClientOnly>
					</div>
				</div>
			</motion.nav>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<motion.div
						key="mobile-menu"
						className="fixed top-16 left-0 z-50 flex h-[calc(100vh-4rem)] w-full flex-col justify-between bg-blue-50 lg:hidden"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.3 }}
					>
						<ul className="flex flex-col items-center py-4 font-medium text-slate-500">
							{!pathname.startsWith("/admin") &&
								!pathname.startsWith("/dashboard") &&
								NavItems.map((item, index) => (
									<motion.li
										key={item}
										className="w-full py-2 text-center"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.2, delay: index * 0.05 }}
									>
										<Link
											href={
												item === "Home"
													? "/"
													: `/${item
															.toLowerCase()
															.replace(/ & /g, "-")
															.replace(/ /g, "-")}`
											}
											className="block w-full transition-colors duration-200 ease-in-out hover:text-blue-400"
											onClick={() => setIsMobileMenuOpen(false)}
											target={
												item === "Rate Calculator" || item === "Track"
													? "_blank"
													: undefined
											}
											rel={
												item === "Rate Calculator" || item === "Track"
													? "noopener noreferrer"
													: undefined
											}
										>
											{item}
										</Link>
									</motion.li>
								))}
						</ul>

						<div className="flex flex-col items-center gap-2 pb-4">
							{user || isAuthenticatedOptimistic ? (
								<>
									{(user?.role === "Client" || !user) && (
										<div className="flex items-center gap-2 text-blue-950">
											<Dialog
												open={isDialogOpen}
												onOpenChange={setIsDialogOpen}
											>
												<DialogTrigger asChild>
													<Button
														variant="outline"
														className="cursor-pointer bg-transparent hover:bg-blue-100"
													>
														<Plus className="h-4 w-4 text-blue-950" />
													</Button>
												</DialogTrigger>

												<DialogContent className="sm:max-w-md">
													<DialogHeader>
														<DialogTitle>Add Funds</DialogTitle>
													</DialogHeader>
													<div className="flex flex-col gap-4">
														<Input
															type="number"
															placeholder="Enter amount"
															value={amount}
															onChange={(e) => setAmount(e.target.value)}
															min={1}
														/>
													</div>
													<DialogFooter>
														<Button
															onClick={async () => {
																const amt = Number.parseFloat(amount);
																if (Number.isNaN(amt) || amt <= 0) return;

																try {
																	const res = await addFunds.mutateAsync({
																		amount: amt,
																	});

																	if (res?.paymentUrl) {
																		window.location.href = res.paymentUrl;
																	}
																} catch (err) {
																	console.error(err);
																} finally {
																	setIsDialogOpen(false);
																	setAmount("");
																}
															}}
															disabled={addFunds.isPending || !amount}
														>
															{addFunds.isPending
																? "Redirecting..."
																: "Pay Now"}
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
											₹{String(user?.walletBalance)}
											<Wallet className="h-4 w-4" />
											<Button
												variant="ghost"
												size="icon"
												onClick={async () => {
													await checkPendingTxns.mutateAsync();
													await utils.auth.me.invalidate();
													await utils.wallet.getPassbook.invalidate();
												}}
												disabled={checkPendingTxns.isPending}
												className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										</div>
									)}

									<Link href={getDashboardRoute()}>
										<Button
											variant="outline"
											className="w-32"
											onClick={() => setIsMobileMenuOpen(false)}
										>
											<LayoutDashboard className="mr-2 h-4 w-4" />
											Dashboard
										</Button>
									</Link>

									<Button
										className="w-32 bg-red-400 text-white hover:bg-red-500"
										onClick={handleLogout}
									>
										<LogOut className="mr-2 h-4 w-4" />
										Logout
									</Button>
								</>
							) : (
								<Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
									<Button
										variant="outline"
										className="w-32 border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
										disabled={!user && isLoading}
									>
										<LogIn className="mr-2 h-4 w-4" />
										Login
									</Button>
								</Link>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default Navbar;

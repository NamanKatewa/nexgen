import { Instagram, Linkedin, Mail, Phone, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const socialMediaIcons = [
	{
		icon: <Twitter />,
		link: "https://x.com/Nexgencourier",
		label: "Twitter",
	},
	{
		icon: <Instagram />,
		link: "https://www.instagram.com/nexgencourierservice",
		label: "Instagram",
	},
	{
		icon: <Linkedin />,
		link: "https://www.linkedin.com/company/nex-gen-courier-service/posts",
		label: "LinkedIn",
	},
];

const Footer = () => {
	return (
		<footer className="mt-16 bg-blue-100 py-16 text-blue-950 shadow-lg">
			<div className="container mx-auto px-4 md:px-6">
				<div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-4">
					<div className="flex flex-col items-start space-y-6">
						<Link
							href="/"
							className="group flex items-center space-x-3 transition-transform hover:scale-105"
							prefetch={false}
						>
							<Image
								src="/logo.png"
								width={60}
								height={60}
								alt="Nex Gen Courier Service Logo"
							/>
							<span className="font-bold text-2xl tracking-tight">
								Nex Gen Courier Service
							</span>
						</Link>
						<p className="text-base leading-relaxed">
							Bringing You Closer to What You Need, When You Need It - Trusted
							Deliveries, Every Time.
						</p>
					</div>

					<div className="space-y-6">
						<h3 className="font-bold text-xl tracking-tight">Our Location</h3>
						<div className="space-y-6">
							<div className="rounded-lg bg-white/50 p-6 shadow-sm backdrop-blur-sm ">
								<p className="text-base leading-relaxed">
									<span className="block font-bold">Corporate Address:</span>
									395-A Chauhan Mohhala Madanpur Khadar
									<br />
									Sarita Vihar
									<br />
									<span className="font-medium">Pincode:</span> 110076
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<h3 className="font-bold text-xl tracking-tight">Resources</h3>
						<nav className="flex flex-col space-y-4">
							{[
								"Refund Policy",
								"Privacy Policy",
								"Terms & Conditions",
								"Insurance Rates",
							].map((item) => (
								<Link
									key={item}
									href={`/${item.toLowerCase().replace(/[\s&]+/g, "-")}`}
									className="group flex items-center text-base transition-colors hover:text-blue-600"
									prefetch={false}
								>
									<span className="relative">
										{item}
										<span className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-600 transition-all group-hover:w-full dark:bg-blue-400" />
									</span>
								</Link>
							))}
						</nav>
					</div>

					<div className="space-y-6">
						<h3 className="font-bold text-xl tracking-tight">Contact Us</h3>
						<div className="space-y-4">
							<a
								href="tel:+911169653981"
								className="group flex items-center space-x-3 transition-colors hover:text-blue-600"
							>
								<Phone className="h-5 w-5" />
								<span>+91 11 6965 3981</span>
							</a>
							<a
								href="mailto:help@nexgencourierservice.in"
								className="group flex items-center space-x-3 transition-colors hover:text-blue-600 "
							>
								<Mail className="h-5 w-5" />
								<span>help@nexgencourierservice.in</span>
							</a>
						</div>

						<div className="space-y-4">
							<h4 className="font-semibold text-lg">Follow Us</h4>
							<div className="flex space-x-4">
								{socialMediaIcons.map((social) => (
									<Link
										key={social.link}
										href={social.link}
										className="group rounded-full bg-blue-100 p-2 transition-all hover:text-blue-600"
										prefetch={false}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={social.label}
									>
										{social.icon}
									</Link>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-16 border-blue-950 border-t pt-8">
					<p className="text-center text-blue-950 text-sm">
						&copy; {new Date().getFullYear()} Kishan Kumar Shah. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;

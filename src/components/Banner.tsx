import { VelocityScroll } from "~/components/magicui/scroll-based-velocity";

const Banner = () => {
	return (
		<VelocityScroll
			defaultVelocity={2}
			className="text-7xl text-blue-950 leading-20"
		>
			Nex Gen Courier Services
		</VelocityScroll>
	);
};

export default Banner;

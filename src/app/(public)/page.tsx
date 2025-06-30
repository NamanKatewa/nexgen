import Banner from "~/components/Banner";
import Hero from "~/components/Hero";
import Partners from "~/components/Partners";
import Services from "~/components/Services";
import Tracking from "~/components/Tracking";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<Tracking />
			<Hero />
			<Banner />
			<Partners />
			<Services />
		</HydrateClient>
	);
}

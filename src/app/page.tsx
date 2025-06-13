import { HydrateClient } from "~/trpc/server";
import Hero from "~/components/Hero";
import Banner from "~/components/Banner";
import Partners from "~/components/Partners";
import Services from "~/components/Services";
import Tracking from "~/components/Tracking";

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

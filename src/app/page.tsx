import { HydrateClient } from "~/trpc/server";
import Navbar from "~/components/Navbar";
import Hero from "~/components/Hero";
import Banner from "~/components/Banner";
import Partners from "~/components/Partners";
import Services from "~/components/Services";
import Footer from "~/components/Footer";

export default async function Home() {
  return (
    <HydrateClient>
      <Navbar />
      <Hero />
      <Banner />
      <Partners />
      <Services />
      <Footer />
    </HydrateClient>
  );
}

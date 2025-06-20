import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nexgencourierservice.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default config;

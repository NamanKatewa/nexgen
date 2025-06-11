"use client";

import { cn } from "~/lib/utils";
import { SparklesText } from "~/components/magicui/sparkles-text";
import { BentoGrid, BentoGridItem } from "~/components/magicui/bento-grid";
import { motion } from "motion/react";
import {
  Hash,
  UserIcon,
  TruckIcon,
  Package,
  ReceiptIndianRupee,
  PackageCheck,
  Map,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";

const CourierServices = () => {
  return (
    <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
      {services.map((service, i) => (
        <BentoGridItem
          key={i}
          title={service.title}
          description={service.description}
          header={service.header}
          className={cn("[&>p:text-lg]", service.className)}
          icon={service.icon}
        />
      ))}
    </BentoGrid>
  );
};

const SkeletonOne = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 bg-dot-black"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-center space-x-2 rounded-full border border-neutral-100  bg-white p-2 dark:border-white/[0.2] dark:bg-black"
      >
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" />
        <div className="h-4 w-full rounded-full bg-gray-100 dark:bg-neutral-900" />
      </motion.div>
    </motion.div>
  );
};

const SkeletonTwo = () => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };

  const [widths, setWidths] = useState<number[]>([]);

  useEffect(() => {
    const newWidths = new Array(6)
      .fill(0)
      .map(() => Math.random() * (100 - 40) + 40);
    setWidths(newWidths);
  }, []);

  if (widths.length === 0) {
    return (
      <div className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 bg-dot-black/[0.2] dark:bg-dot-white/[0.2]">
        {new Array(6).fill(0).map((_, i) => (
          <div
            key={"skelenton-two-ssr-" + i}
            className="flex h-4 w-full flex-row items-center space-x-2 rounded-full border border-neutral-100 bg-blue-500 p-2 dark:border-white/[0.2] dark:bg-black"
            style={{ maxWidth: `50%` }}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 bg-dot-black/[0.2] dark:bg-dot-white/[0.2]"
    >
      {widths.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxWidth: Math.random() * (100 - 40) + 40 + "%",
          }}
          className="flex h-4 w-full flex-row items-center space-x-2 rounded-full  border border-neutral-100 bg-blue-500 p-2 dark:border-white/[0.2] dark:bg-black"
        ></motion.div>
      ))}
    </motion.div>
  );
};

const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 rounded-lg bg-dot-black/[0.2] dark:bg-dot-white/[0.2]"
      style={{
        background: `url("/tracking.jpg")`,
        backgroundSize: "cover",
      }}
    >
      <motion.div className="h-full w-full rounded-lg"></motion.div>
    </motion.div>
  );
};

const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-row space-x-2 bg-dot-black/[0.2] dark:bg-dot-white/[0.2]"
    >
      <motion.div
        variants={first}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-black"
      >
        <Hash className="h-10 w-10 text-blue-500" />
        <p className="mt-4 text-center text-xs font-semibold text-neutral-500 sm:text-sm">
          Hey Package is Damaged
        </p>
        <p className="mt-4 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/20">
          Urgent
        </p>
      </motion.div>
      <motion.div className="relative z-20 flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-black">
        <Hash className="h-10 w-10 text-blue-500" />
        <p className="mt-4 text-center text-xs font-semibold text-neutral-500 sm:text-sm">
          Hey delivery is late
        </p>
        <p className="mt-4 rounded-full border border-green-500 bg-green-100 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/20">
          Solved
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-black"
      >
        <Hash className="h-10 w-10 text-blue-500" />
        <p className="mt-4 text-center text-xs font-semibold text-neutral-500 sm:text-sm">
          Hey I am not able to track my package
        </p>
        <p className="mt-4 rounded-full border border-orange-500 bg-orange-100 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/20">
          Checking
        </p>
      </motion.div>
    </motion.div>
  );
};

const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 bg-dot-black/[0.2] dark:bg-dot-white/[0.2]"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-start space-x-2 rounded-2xl border border-neutral-100  bg-white p-2 dark:border-white/[0.2] dark:bg-black"
      >
        <UserIcon className="h-5 w-5 stroke-blue-600" />
        <p className="text-xs text-neutral-500">
          Hey I did not recieve my package. I wonder if it&apos;s lost.
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="ml-auto flex w-3/4 flex-row items-center justify-end space-x-2 rounded-full border border-neutral-100 bg-white p-2 dark:border-white/[0.2] dark:bg-black"
      >
        <p className="text-xs text-neutral-500">Sending you the image sir.</p>
        <TruckIcon className="h-5 w-5 stroke-blue-600" />
      </motion.div>
    </motion.div>
  );
};

const services = [
  {
    title: "Package Pickup",
    description: (
      <span className="text-sm">
        Our courier partners will pick up your items from your location.
      </span>
    ),
    header: <SkeletonOne />,
    className: "md:col-span-1",
    icon: <Package className="h-8 w-8 text-blue-500" />,
  },
  {
    title: "Safe Delivery",
    description: (
      <span className="text-sm">
        Get your packages delivered safely, anywhere in the country.
      </span>
    ),
    header: <SkeletonTwo />,
    className: "md:col-span-1",
    icon: <Truck className="h-8 w-8 text-green-500" />,
  },
  {
    title: "Tracking & Notifications",
    description: (
      <span className="text-sm">
        Stay informed with real-time package tracking and updates.
      </span>
    ),
    header: <SkeletonThree />,
    className: "md:col-span-1",
    icon: <Map className="h-8 w-8 text-orange-500" />,
  },
  {
    title: "Customer Support",
    description: (
      <span className="text-sm">
        Have a query. Raise a ticket and stay updated with our support team.
      </span>
    ),
    header: <SkeletonFour />,
    className: "md:col-span-2",
    icon: <PackageCheck className="h-8 w-8 text-purple-500" />,
  },
  {
    title: "Proof of Delivery",
    description: (
      <span className="text-sm">
        Get digital proof of delivery for your peace of mind.
      </span>
    ),
    header: <SkeletonFive />,
    className: "md:col-span-1",
    icon: <ReceiptIndianRupee className="h-8 w-8 text-pink-500" />,
  },
];

const Services = () => {
  return (
    <section className="flex flex-col gap-10">
      <h2 className="text-center text-2xl font-bold tracking-[-0.02rem] text-black drop-shadow-sm">
        <SparklesText>What we do</SparklesText>
      </h2>
      <CourierServices />
    </section>
  );
};

export default Services;

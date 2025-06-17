import { memo, useMemo } from "react";
import { VelocityScroll } from "~/components/magicui/scroll-based-velocity";

const Banner = () => {
  const text = useMemo(() => "Nex Gen Courier Services", []);
  const className = useMemo(() => "text-blue-950 text-7xl leading-20", []);

  return (
    <VelocityScroll defaultVelocity={2} className={className}>
      {text}
    </VelocityScroll>
  );
};

export default memo(Banner);

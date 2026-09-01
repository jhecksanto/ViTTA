import React from "react";

export const Skeleton = ({
  className = "",
  ...props
}: {
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`animate-pulse bg-vitta-surface-2 rounded-xl ${className}`}
    {...props}
  />
);

export default Skeleton;

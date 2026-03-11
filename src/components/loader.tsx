import React from "react";

type OrbitLoaderProps = {
  size?: number; // diameter in Tailwind scale (e.g., 16 = w-16 h-16)
  outerColor?: string;
  innerColor?: string;
};

const OrbitLoader: React.FC<OrbitLoaderProps> = ({
  size = 3,
  outerColor = "border-primary",
}) => {
  const sizeClass = `w-${size} h-${size}`;

  return (
    <div className={`relative ${sizeClass}`}>
      {/* Outer Ring */}
      <div
        className={`absolute inset-0 border-4 ${outerColor} border-dashed rounded-full animate-spin `}
      ></div>
    </div>
  );
};

export default OrbitLoader;

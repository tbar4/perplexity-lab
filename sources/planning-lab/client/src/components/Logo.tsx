// Geometric mark: a node-graph shape evoking search frontiers + planning trees.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="Planning Lab"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.25" />
      {/* Root node */}
      <circle cx="16" cy="7" r="2" fill="currentColor" />
      {/* Branches */}
      <path
        d="M16 9 L8 18 M16 9 L24 18 M8 20 L8 24 M8 20 L13 24 M24 20 L19 24 M24 20 L24 24"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <circle cx="8" cy="19" r="1.5" fill="currentColor" />
      <circle cx="24" cy="19" r="1.5" fill="currentColor" />
      <circle cx="8" cy="25" r="1.25" fill="currentColor" />
      <circle cx="13" cy="25" r="1.25" fill="currentColor" />
      <circle cx="19" cy="25" r="1.25" fill="currentColor" />
      <circle cx="24" cy="25" r="1.25" fill="currentColor" />
    </svg>
  );
}

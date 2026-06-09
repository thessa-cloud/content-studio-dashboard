"use client";
import { ReactNode } from "react";

/**
 * Consistent page wrapper for every tab.
 * Keeps padding + max-width identical across the dashboard so tabs feel
 * like one product, not a stitched collection.
 */
export default function TabContainer({ children }: { children: ReactNode }) {
  return (
    <div className="tab-container">
      {children}
      <style jsx>{`
        .tab-container {
          padding: 2.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .tab-container {
            padding: 1.25rem 1rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}

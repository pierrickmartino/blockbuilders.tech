/**
 * @fileoverview Suspense fallback while seeding the demo workspace.
 */

import { ReactElement } from "react";

/**
 * Presents a minimal loading indicator during dashboard hydration.
 *
 * @returns {ReactElement} Loading feedback view.
 */
export default function DashboardLoading(): ReactElement {
  return (
    <main>
      <p>Preparing your demo workspace...</p>
    </main>
  );
}

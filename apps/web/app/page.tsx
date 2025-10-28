/**
 * @fileoverview Marketing landing page entrypoint for unauthenticated visitors.
 */

import Link from "next/link";
import { ReactElement } from "react";

/**
 * Renders key calls to action directing users to authentication and documentation.
 *
 * @returns {ReactElement} Landing page hero content.
 */
export default function LandingPage(): ReactElement {
  return (
    <main>
      <h1>BlockBuilders Platform</h1>
      <p>
        Bootstrapped monorepo ready for authentication, compliance logging, and guided strategy building.
      </p>
      <div className="button-row">
        <Link className="button primary" href="/login">
          Sign In
        </Link>
        <Link className="button" href="/docs">
          View Docs
        </Link>
      </div>
    </main>
  );
}

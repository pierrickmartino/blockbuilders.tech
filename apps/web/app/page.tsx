import Link from "next/link";

export default function LandingPage() {
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

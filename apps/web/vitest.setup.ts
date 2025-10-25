import "@testing-library/jest-dom/vitest";
import React from "react";

// Ensure automatic JSX runtime has React available in tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).React = React;

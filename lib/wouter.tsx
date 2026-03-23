"use client";

import {
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import NextLink from "next/link";

type Navigate = (to: string) => void;

export function useLocation(): [string, Navigate] {
  const [location, setLocation] = useState("/");

  useEffect(() => {
    const updateLocation = () => {
      if (typeof window === "undefined") {
        return;
      }

      setLocation(`${window.location.pathname}${window.location.search}`);
    };

    updateLocation();
    window.addEventListener("popstate", updateLocation);

    return () => {
      window.removeEventListener("popstate", updateLocation);
    };
  }, []);

  return [
    location,
    (to: string) => {
      window.location.assign(to);
    },
  ];
}

export function useParams<T extends Record<string, string>>() {
  if (typeof window === "undefined") {
    return {} as T;
  }

  const segments = window.location.pathname.split("/").filter(Boolean);
  const token = segments[segments.length - 1] || "";

  return { token } as unknown as T;
}

export function Link({
  href,
  children,
  ...props
}: PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}

// Legacy compatibility only for files that are no longer used directly.
export function Switch({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Route({
  component: Component,
  children,
}: {
  path?: string;
  component?: ComponentType<any>;
  children?: ReactNode;
}) {
  if (Component) {
    return <Component />;
  }

  return <>{children}</>;
}

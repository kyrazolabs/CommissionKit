import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders children", async () => {
    const { Button } = await import("@/components/ui/button");
    render(React.createElement(Button, null, "Click Me"));
    expect(screen.getByText("Click Me")).not.toBeNull();
  });

  test("handles click events", async () => {
    const { Button } = await import("@/components/ui/button");
    let clicked = false;
    render(
      React.createElement(Button, {
        onClick: () => {
          clicked = true;
        },
        children: "Click Me",
      }),
    );
    await userEvent.click(screen.getByText("Click Me"));
    expect(clicked).toBe(true);
  });

  test("applies default variant classes", async () => {
    const { Button } = await import("@/components/ui/button");
    render(React.createElement(Button, { children: "Default" }));
    const btn = screen.getByText("Default");
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("text-primary-foreground");
  });

  test("applies destructive variant", async () => {
    const { Button } = await import("@/components/ui/button");
    render(
      React.createElement(Button, {
        variant: "destructive",
        children: "Destructive",
      }),
    );
    const btn = screen.getByText("Destructive");
    expect(btn.className).toContain("bg-destructive");
    expect(btn.className).toContain("text-destructive-foreground");
  });

  test("applies outline variant", async () => {
    const { Button } = await import("@/components/ui/button");
    render(
      React.createElement(Button, {
        variant: "outline",
        children: "Outline",
      }),
    );
    const btn = screen.getByText("Outline");
    expect(btn.className).not.toContain("bg-primary");
  });

  test("applies size variant classes", async () => {
    const { Button } = await import("@/components/ui/button");
    render(React.createElement(Button, { size: "lg", children: "Large" }));
    const btn = screen.getByText("Large");
    expect(btn.className).toContain("min-h-10");
  });

  test("applies custom className", async () => {
    const { Button } = await import("@/components/ui/button");
    render(
      React.createElement(Button, {
        className: "custom-class",
        children: "Custom",
      }),
    );
    const btn = screen.getByText("Custom");
    expect(btn.className).toContain("custom-class");
  });

  test("renders disabled button", async () => {
    const { Button } = await import("@/components/ui/button");
    let clicked = false;
    render(
      React.createElement(Button, {
        disabled: true,
        onClick: () => {
          clicked = true;
        },
        children: "Disabled",
      }),
    );
    const btn = screen.getByText("Disabled") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test("renders as a link when asChild with anchor", async () => {
    const { Button } = await import("@/components/ui/button");
    render(
      React.createElement(
        Button,
        { asChild: true },
        React.createElement("a", { href: "#link", children: "Link Button" }),
      ),
    );
    const el = screen.getByText("Link Button");
    expect(el.tagName).toBe("A");
  });
});

describe("buttonVariants", () => {
  test("exports buttonVariants for use in other components", async () => {
    const { buttonVariants } = await import("@/components/ui/button");
    const classes = buttonVariants({ variant: "default", size: "default" });
    expect(classes).toContain("inline-flex");
    expect(classes).toContain("items-center");
  });
});

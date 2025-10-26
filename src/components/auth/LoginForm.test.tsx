import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { LoginForm } from "./LoginForm";

// Mock the global fetch function
global.fetch = vi.fn();

function createFetchResponse(data: Record<string, unknown>, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => new Promise((resolve) => resolve(data)),
  };
}

describe("LoginForm", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-expect-error - Deliberately mocking window.location for testing purposes
    delete window.location;
    // @ts-expect-error - Deliberately mocking window.location for testing purposes
    window.location = { ...originalLocation, href: "http://localhost:4321/login" };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location = originalLocation;
  });

  it("should redirect to /generate on successful login", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse({}, 200));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });

  it("should display server error message on failed login", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      createFetchResponse({ error: "Nieprawidłowe dane logowania" }, 401)
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    await waitFor(() => {
      expect(screen.getByText("Nieprawidłowe dane logowania")).toBeInTheDocument();
    });
  });

  it("should display network error message when fetch fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    await waitFor(() => {
      expect(screen.getByText("Nie udało się połączyć z serwerem.")).toBeInTheDocument();
    });
  });
});

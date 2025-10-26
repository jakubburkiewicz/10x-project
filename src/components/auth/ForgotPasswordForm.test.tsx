import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

// Mock the global fetch function
global.fetch = vi.fn();

function createFetchResponse(data: Record<string, unknown>, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => new Promise((resolve) => resolve(data)),
  };
}

describe("ForgotPasswordForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display success message after successful submission", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse({}, 200));

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zresetuj hasło/i }));

    await waitFor(() => {
      expect(screen.getByText("Sprawdź swoją skrzynkę pocztową")).toBeInTheDocument();
    });
  });

  it("should display server error message on failed submission", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      createFetchResponse({ error: "Nie znaleziono użytkownika" }, 404)
    );

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zresetuj hasło/i }));

    await waitFor(() => {
      expect(screen.getByText("Nie znaleziono użytkownika")).toBeInTheDocument();
    });
  });

  it("should display network error message when fetch fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zresetuj hasło/i }));

    await waitFor(() => {
      expect(screen.getByText("Nie udało się połączyć z serwerem.")).toBeInTheDocument();
    });
  });
});

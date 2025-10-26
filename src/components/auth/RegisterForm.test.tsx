import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { RegisterForm } from "./RegisterForm";

// Mock the global fetch function
global.fetch = vi.fn();

function createFetchResponse(data: Record<string, unknown>, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => new Promise((resolve) => resolve(data)),
  };
}

describe("RegisterForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display success message after successful registration", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse({ success: true }, 200));

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Hasło$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Powtórz hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText("Rejestracja udana!")).toBeInTheDocument();
    });
  });

  it("should display server error message on failed registration", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      createFetchResponse({ error: "Użytkownik już istnieje" }, 400)
    );

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Hasło$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Powtórz hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText("Użytkownik już istnieje")).toBeInTheDocument();
    });
  });

  it("should display network error message when fetch fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Adres e-mail/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Hasło$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Powtórz hasło/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText("Nie udało się połączyć z serwerem.")).toBeInTheDocument();
    });
  });
});

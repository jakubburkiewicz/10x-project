import React, { useState } from "react";
import type {
  CardSuggestionViewModel,
  GenerateCardsCommand,
  GenerateCardsResponseDto,
  SaveGeneratedCardsCommand,
  SaveGeneratedCardsResponseDto,
} from "@/types";
import { GenerateForm } from "./GenerateForm";
import { SuggestionsList } from "./SuggestionsList";
import { Toaster, toast } from "sonner";

const GenerateView = () => {
  const [text, setText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<CardSuggestionViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSuggestions = async (inputText: string) => {
    setText(inputText);
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const command: GenerateCardsCommand = { text: inputText };
      const response = await fetch("/api/ai/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
      }

      const data: GenerateCardsResponseDto = await response.json();

      if (data.suggestions.length === 0) {
        toast.info("Nie udało się wygenerować żadnych fiszek z podanego tekstu.");
      } else {
        toast.success(`Wygenerowano ${data.suggestions.length} propozycji.`);
      }

      setSuggestions(
        data.suggestions.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          status: "pending",
          isEditing: false,
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuggestion = (id: string, updatedFields: Partial<CardSuggestionViewModel>) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
  };

  const handleSaveCards = async () => {
    const acceptedCards = suggestions
      .filter((s) => s.status === "accepted")
      .map(({ front, back }) => ({ front, back }));

    if (acceptedCards.length === 0) {
      toast.info("Nie wybrano żadnych fiszek do zapisania.");
      return;
    }

    setIsSaving(true);
    try {
      const command: SaveGeneratedCardsCommand = {
        originalText: text,
        generatedCount: suggestions.length,
        acceptedCards,
      };

      const response = await fetch("/api/ai/save-generated-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Błąd serwera: ${response.status}`);
      }

      const data: SaveGeneratedCardsResponseDto = await response.json();
      toast.success(data.message);
      setSuggestions([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania fiszek.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Generuj Fiszki z Tekstu</h1>
      <p className="text-muted-foreground">
        Wklej tekst, z którego chcesz wygenerować fiszki. System automatycznie zaproponuje pytania i odpowiedzi.
      </p>
      <GenerateForm onGenerate={handleGenerateSuggestions} isLoading={isLoading} error={error} />
      {suggestions.length > 0 && (
        <SuggestionsList
          suggestions={suggestions}
          onUpdateSuggestion={handleUpdateSuggestion}
          onSave={handleSaveCards}
          isSaving={isSaving}
        />
      )}
      <Toaster richColors />
    </div>
  );
};

export default GenerateView;

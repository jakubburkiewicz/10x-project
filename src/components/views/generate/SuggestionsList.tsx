import React, { useMemo } from "react";
import type { CardSuggestionViewModel } from "@/types";
import { SuggestionCard } from "./SuggestionCard";
import { Button } from "@/components/ui/button";

interface SuggestionsListProps {
  suggestions: CardSuggestionViewModel[];
  onUpdateSuggestion: (id: string, updatedFields: Partial<CardSuggestionViewModel>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onUpdateSuggestion,
  onSave,
  isSaving,
}) => {
  const acceptedCount = useMemo(() => suggestions.filter((s) => s.status === "accepted").length, [suggestions]);

  const canSave = acceptedCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Wygenerowane Propozycje</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Zaakceptowano: {acceptedCount} / {suggestions.length}
          </p>
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz wybrane"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} onUpdate={onUpdateSuggestion} />
        ))}
      </div>
    </div>
  );
};

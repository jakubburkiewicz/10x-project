import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface GenerateFormProps {
  onGenerate: (text: string) => void;
  isLoading: boolean;
  error: string | null;
}

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

export const GenerateForm: React.FC<GenerateFormProps> = ({ onGenerate, isLoading, error }) => {
  const [text, setText] = useState("");

  const isValid = useMemo(() => {
    return text.length >= MIN_LENGTH && text.length <= MAX_LENGTH;
  }, [text.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onGenerate(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Wklej tutaj tekst (minimum 1000 znaków, maksimum 10000 znaków)..."
        className="min-h-[200px] resize-y"
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Liczba znaków: {text.length} / {MAX_LENGTH}
        </p>
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          Generuj Fiszki
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isValid && text.length > 0 && (
        <p className="text-sm text-destructive">
          Tekst musi mieć od {MIN_LENGTH} do {MAX_LENGTH} znaków.
        </p>
      )}
    </form>
  );
};

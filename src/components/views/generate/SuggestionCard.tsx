import React, { useState } from "react";
import type { CardSuggestionViewModel } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Edit, Save, ThumbsDown, ThumbsUp, X } from "lucide-react";

interface SuggestionCardProps {
  suggestion: CardSuggestionViewModel;
  onUpdate: (id: string, updatedFields: Partial<CardSuggestionViewModel>) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onUpdate }) => {
  const [front, setFront] = useState(suggestion.front);
  const [back, setBack] = useState(suggestion.back);

  const handleSave = () => {
    onUpdate(suggestion.id, { front, back, isEditing: false });
  };

  const handleCancel = () => {
    setFront(suggestion.front);
    setBack(suggestion.back);
    onUpdate(suggestion.id, { isEditing: false });
  };

  const cardBorderColor =
    suggestion.status === "accepted" ? "border-green-500" : suggestion.status === "rejected" ? "border-red-500" : "";

  return (
    <Card className={`transition-all ${cardBorderColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          Propozycja Fiszki
          {suggestion.status === "accepted" && <ThumbsUp className="h-5 w-5 text-green-500" />}
          {suggestion.status === "rejected" && <ThumbsDown className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestion.isEditing ? (
          <>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="resize-none"
              placeholder="Przód fiszki"
            />
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="resize-none"
              placeholder="Tył fiszki"
            />
          </>
        ) : (
          <>
            <p className="rounded-md bg-muted p-3">{suggestion.front}</p>
            <p className="rounded-md bg-muted p-3">{suggestion.back}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {suggestion.isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Anuluj
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Zapisz
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => onUpdate(suggestion.id, { isEditing: true })}>
              <Edit className="mr-2 h-4 w-4" /> Edytuj
            </Button>
            {suggestion.status !== "rejected" && (
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-100 hover:text-red-600"
                onClick={() => onUpdate(suggestion.id, { status: "rejected" })}
              >
                <X className="mr-2 h-4 w-4" /> Odrzuć
              </Button>
            )}
            {suggestion.status !== "accepted" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onUpdate(suggestion.id, { status: "accepted" })}
              >
                <Check className="mr-2 h-4 w-4" /> Akceptuj
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

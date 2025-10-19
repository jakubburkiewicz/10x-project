import React, { useState } from "react";
import type { CardSuggestionViewModel } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  const textAreaClassName =
    "resize-none bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-3 w-full h-full rounded-md text-sm";

  return (
    <Card className={`flex flex-col transition-all ${cardBorderColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          Propozycja Fiszki
          {suggestion.status === "accepted" && <ThumbsUp className="h-5 w-5 text-green-500" />}
          {suggestion.status === "rejected" && <ThumbsDown className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        <div className="flex-grow-0">
          {suggestion.isEditing ? (
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className={`${textAreaClassName} bg-white dark:bg-gray-950 border border-input`}
              placeholder="Przód fiszki"
            />
          ) : (
            <p className="rounded-md bg-muted p-3">{suggestion.front}</p>
          )}
        </div>
        <div className="flex flex-1 flex-col">
          {suggestion.isEditing ? (
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className={`${textAreaClassName} flex-1 bg-white dark:bg-gray-950 border border-input`}
              placeholder="Tył fiszki"
            />
          ) : (
            <p className="flex-1 rounded-md bg-muted p-3">{suggestion.back}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <TooltipProvider>
          {suggestion.isEditing ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Anuluj</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anuluj</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Zapisz</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zapisz</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onUpdate(suggestion.id, { isEditing: true })}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edytuj</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edytuj</p>
                </TooltipContent>
              </Tooltip>
              {suggestion.status !== "rejected" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-red-100 hover:text-red-600"
                      onClick={() => onUpdate(suggestion.id, { status: "rejected" })}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Odrzuć</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Odrzuć</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {suggestion.status !== "accepted" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onUpdate(suggestion.id, { status: "accepted" })}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Akceptuj</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Akceptuj</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

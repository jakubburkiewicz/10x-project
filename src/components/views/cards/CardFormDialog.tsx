import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateCardDtoSchema, type CardDto, type CreateCardDto, type UpdateCardCommand } from "@/types";

interface CardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCardDto | UpdateCardCommand) => void;
  cardToEdit?: CardDto | null;
}

const CardFormDialog: React.FC<CardFormDialogProps> = ({ isOpen, onClose, onSave, cardToEdit }) => {
  const isEditMode = !!cardToEdit;

  const form = useForm<z.infer<typeof CreateCardDtoSchema>>({
    resolver: zodResolver(CreateCardDtoSchema),
    defaultValues: {
      front: "",
      back: "",
      source: "manual",
    },
  });

  useEffect(() => {
    if (isEditMode && cardToEdit) {
      form.reset({
        front: cardToEdit.front,
        back: cardToEdit.back,
        source: "manual",
      });
    } else {
      form.reset({
        front: "",
        back: "",
        source: "manual",
      });
    }
  }, [cardToEdit, isEditMode, form]);

  const onSubmit = (data: z.infer<typeof CreateCardDtoSchema>) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Card" : "Create Card"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Make changes to your card here." : "Add a new card to your collection."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'What is the capital of Poland?'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 'Warsaw'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CardFormDialog;

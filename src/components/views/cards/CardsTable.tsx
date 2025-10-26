import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CardDto } from "@/types";
import DataTableRowActions from "./DataTableRowActions";

interface CardsTableProps {
  cards: CardDto[];
  onEdit: (card: CardDto) => void;
  onDelete: (card: CardDto) => void;
}

const CardsTable: React.FC<CardsTableProps> = ({ cards, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Front</TableHead>
            <TableHead>Back</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.length > 0 ? (
            cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-medium">{card.front}</TableCell>
                <TableCell>{card.back}</TableCell>
                <TableCell>{new Date(card.due_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DataTableRowActions card={card} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No cards found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CardsTable;

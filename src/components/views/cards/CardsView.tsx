import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import type { CardsViewModel, CardDto, CreateCardDto, UpdateCardCommand } from "@/types";
import CardsTable from "./CardsTable";
import CardFormDialog from "./CardFormDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import Pagination from "./Pagination";
import { Spinner } from "@/components/ui/spinner";

const CardsView = () => {
  const [viewModel, setViewModel] = useState<CardsViewModel>({
    cards: [],
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalCount: 0,
    },
    isLoading: true,
    error: null,
    activeFilters: {},
    sorting: {},
    dialogs: {
      isCardFormOpen: false,
      isDeleteConfirmationOpen: false,
      cardToEdit: null,
      cardToDelete: null,
    },
  });

  const fetchCards = useCallback(
    async (page = 1) => {
      setViewModel((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await fetch(`/api/cards?page=${page}&pageSize=${viewModel.pagination.pageSize}`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch cards");
        }
        const data: { data: CardDto[]; count: number } = await response.json();
        setViewModel((prev) => ({
          ...prev,
          cards: data.data,
          pagination: {
            ...prev.pagination,
            totalCount: data.count,
            totalPages: Math.ceil(data.count / prev.pagination.pageSize),
            currentPage: page,
          },
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        setViewModel((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        toast.error(errorMessage);
      }
    },
    [viewModel.pagination.pageSize]
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handlePageChange = (page: number) => {
    fetchCards(page);
  };

  const handleCloseDialogs = () => {
    setViewModel((prev) => ({
      ...prev,
      dialogs: {
        ...prev.dialogs,
        isCardFormOpen: false,
        isDeleteConfirmationOpen: false,
        cardToEdit: null,
        cardToDelete: null,
      },
    }));
  };

  const handleOpenCreateDialog = () => {
    setViewModel((prev) => ({
      ...prev,
      dialogs: { ...prev.dialogs, isCardFormOpen: true, cardToEdit: null },
    }));
  };

  const handleOpenEditDialog = (card: CardDto) => {
    setViewModel((prev) => ({
      ...prev,
      dialogs: { ...prev.dialogs, isCardFormOpen: true, cardToEdit: card },
    }));
  };

  const handleOpenDeleteDialog = (card: CardDto) => {
    setViewModel((prev) => ({
      ...prev,
      dialogs: { ...prev.dialogs, isDeleteConfirmationOpen: true, cardToDelete: card },
    }));
  };

  const handleSaveCard = async (data: CreateCardDto | UpdateCardCommand) => {
    const isEditMode = viewModel.dialogs.cardToEdit !== null;
    const cardId = viewModel.dialogs.cardToEdit?.id;
    const url = isEditMode ? `/api/cards/${cardId}` : "/api/cards";
    const method = isEditMode ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? "update" : "create"} card`);
      }

      toast.success(`Card successfully ${isEditMode ? "updated" : "created"}!`);
      handleCloseDialogs();
      fetchCards(viewModel.pagination.currentPage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    }
  };

  const handleDeleteCard = async () => {
    const cardToDelete = viewModel.dialogs.cardToDelete;
    if (!cardToDelete) return;

    try {
      const response = await fetch(`/api/cards/${cardToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete card on the server.");
      }
      toast.success("Card deleted.");
      handleCloseDialogs();
      fetchCards(viewModel.pagination.currentPage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Cards</h1>
        <Button onClick={handleOpenCreateDialog}>Add Card</Button>
      </div>

      {viewModel.isLoading && !viewModel.cards.length ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : viewModel.error ? (
        <div className="text-red-500 text-center">{viewModel.error}</div>
      ) : (
        <>
          <CardsTable cards={viewModel.cards} onEdit={handleOpenEditDialog} onDelete={handleOpenDeleteDialog} />
          <Pagination
            currentPage={viewModel.pagination.currentPage}
            totalPages={viewModel.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <CardFormDialog
        isOpen={viewModel.dialogs.isCardFormOpen}
        onClose={handleCloseDialogs}
        onSave={handleSaveCard}
        cardToEdit={viewModel.dialogs.cardToEdit}
      />

      <DeleteConfirmationDialog
        isOpen={viewModel.dialogs.isDeleteConfirmationOpen}
        onClose={handleCloseDialogs}
        onConfirm={handleDeleteCard}
      />
    </>
  );
};

export default CardsView;

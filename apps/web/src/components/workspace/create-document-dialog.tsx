"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@prism/ui/components/dialog";
import { Button } from "@prism/ui/components/button";
import { Input } from "@prism/ui/components/input";
import { Textarea } from "@prism/ui/components/textarea";
import { Label } from "@prism/ui/components/label";
import { toast } from "sonner";

const documentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  text: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

function extractTextFromPDF(file: File, setText: (text: string) => void) {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker source - use npm package worker instead of CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const typedArray = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(" ") + "\n";
        }

        setText(fullText.trim());
        resolve();
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        reject(new Error("Failed to extract text from PDF"));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

interface CreateDocumentDialogProps {
  collectionId: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
  editDocument?: {
    id: string;
    title?: string | null;
    text?: string | null;
  };
}

export function CreateDocumentDialog({
  collectionId,
  onSuccess,
  trigger,
  editDocument,
}: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [hasPdfContent, setHasPdfContent] = useState(false);
  const utils = api.useUtils();
  const isEditing = !!editDocument;

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: editDocument?.title || "",
      text: editDocument?.text || "",
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((file) => file.type === "application/pdf");

      if (pdfFile) {
        setIsExtractingPdf(true);
        try {
          await extractTextFromPDF(pdfFile, (text) => {
            form.setValue("text", text);
            setHasPdfContent(true);
          });
          toast.success("PDF text extracted successfully");
        } catch {
          toast.error("Failed to extract text from PDF");
        } finally {
          setIsExtractingPdf(false);
        }
      } else {
        toast.error("Please drop a PDF file");
      }
    },
    [form]
  );

  const textValue = form.watch("text");
  const hasManualText = textValue && textValue.length > 0 && !hasPdfContent;

  const handleClearContent = useCallback(() => {
    form.setValue("text", "");
    setHasPdfContent(false);
  }, [form]);

  const createDocumentMutation = api.document.create.useMutation({
    onSuccess: () => {
      toast.success("Document created successfully");
      // Invalidate both collections and documents queries
      utils.collections.getById.invalidate({ collectionId });
      utils.document.getByCollectionId.invalidate({ collectionId });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create document");
    },
  });

  const updateDocumentMutation = api.document.update.useMutation({
    onSuccess: () => {
      toast.success("Document updated successfully");
      // Invalidate both collections and documents queries
      utils.collections.getById.invalidate({ collectionId });
      utils.document.getByCollectionId.invalidate({ collectionId });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update document");
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    if (isEditing && editDocument) {
      // Update existing document
      const updateData = {
        id: editDocument.id,
        title: data.title,
        text: data.text || "",
      };
      updateDocumentMutation.mutate(updateData);
    } else {
      // Create new document
      const filteredData = {
        collectionId,
        title: data.title,
        text: data.text || "",
      };
      createDocumentMutation.mutate(filteredData);
    }
  };

  const isLoading =
    createDocumentMutation.isPending ||
    updateDocumentMutation.isPending ||
    isExtractingPdf;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Document" : "Create Document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the document information for this collection."
              : "Add documents for this collection."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter document title"
              {...form.register("title")}
              disabled={isLoading}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <Label>Content</Label>

            {/* PDF Drop Zone */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${hasManualText ? "border-gray-200 bg-gray-50 opacity-50" : ""}
                ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                ${hasPdfContent ? "border-green-500 bg-green-50" : ""}
              `}
              onDragOver={hasManualText ? undefined : handleDragOver}
              onDragLeave={hasManualText ? undefined : handleDragLeave}
              onDrop={hasManualText ? undefined : handleDrop}
            >
              {isExtractingPdf ? (
                <div className="space-y-2">
                  <div className="animate-spin mx-auto w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600">Extracting PDF text...</p>
                </div>
              ) : hasPdfContent ? (
                <div className="space-y-2">
                  <div className="text-green-600 font-medium">
                    ✓ PDF content loaded
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearContent}
                    disabled={isLoading}
                  >
                    Clear and use text input instead
                  </Button>
                </div>
              ) : hasManualText ? (
                <div className="text-gray-500">
                  <p>PDF upload disabled while text is entered below</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl">📄</div>
                  <p className="font-medium text-gray-700">
                    Drop your PDF file here
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF content will be automatically extracted
                  </p>
                </div>
              )}
            </div>

            {/* OR Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text">Enter text manually</Label>
              <Textarea
                id="text"
                placeholder={
                  hasPdfContent
                    ? "PDF content loaded above"
                    : "Enter your text here..."
                }
                rows={6}
                {...form.register("text")}
                disabled={isLoading || hasPdfContent}
                className={`resize-none ${hasPdfContent ? "bg-gray-50 text-gray-500" : ""}`}
              />
              {hasManualText && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearContent}
                    disabled={isLoading}
                  >
                    Clear text
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Document"
                  : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

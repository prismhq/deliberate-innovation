"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@prism/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@prism/ui/components/form";
import { Input } from "@prism/ui/components/input";
import { Button } from "@prism/ui/components/button";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prism/ui/components/select";
import type { SituationDiagramData } from "./situation-diagram-node";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  actions: z.array(z.string().min(1)),
  relations: z.array(z.string().min(1)),
  relationshipConnections: z.array(z.string()),
  resources: z.array(z.string().min(1)),
  channels: z.array(z.string().min(1)),
});

type FormData = z.infer<typeof formSchema>;

interface SituationDiagramDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<SituationDiagramData, "id">,
    relationshipConnections?: string[]
  ) => void;
  initialData?: SituationDiagramData;
  mode: "create" | "edit";
  existingPeople?: Array<{ id: string; title: string }>;
}

export function SituationDiagramDialog({
  open,
  onClose,
  onSave,
  initialData,
  mode,
  existingPeople = [],
}: SituationDiagramDialogProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const preserveScrollPosition = (updateFn: () => void) => {
    const el = scrollContainerRef.current;
    const previousScrollTop = el ? el.scrollTop : 0;
    updateFn();
    requestAnimationFrame(() => {
      if (el) {
        el.scrollTop = previousScrollTop;
      }
    });
  };
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      actions: [],
      relations: [],
      relationshipConnections: [],
      resources: [],
      channels: [],
    },
  });

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        title: initialData?.title || "",
        actions: initialData?.actions || [],
        relations: initialData?.relations || [],
        relationshipConnections: [],
        resources: initialData?.resources || [],
        channels: initialData?.channels || [],
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = (data: FormData) => {
    onSave(
      {
        title: data.title,
        actions: (data.actions || []).filter(Boolean),
        relations: (data.relations || []).filter(Boolean),
        resources: (data.resources || []).filter(Boolean),
        channels: (data.channels || []).filter(Boolean),
      },
      data.relationshipConnections
    );
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Array field helper component
  const ArrayField = ({
    name,
    label,
    description,
  }: {
    name: keyof Pick<
      FormData,
      "actions" | "relations" | "resources" | "channels"
    >;
    label: string;
    description: string;
  }) => {
    const [inputValue, setInputValue] = useState("");

    const addItem = () => {
      if (inputValue.trim()) {
        const currentValues = form.getValues(name);
        preserveScrollPosition(() => {
          form.setValue(name, [...currentValues, inputValue.trim()]);
        });
        setInputValue("");
      }
    };

    const removeItem = (index: number) => {
      const currentValues = form.getValues(name);
      preserveScrollPosition(() => {
        form.setValue(
          name,
          currentValues.filter((_, i) => i !== index)
        );
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem();
      }
    };

    const currentValues = form.watch(name);

    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Add ${label.toLowerCase()}...`}
            />
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {currentValues.length > 0 && (
            <div className="space-y-1">
              {currentValues.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted p-2 rounded"
                >
                  <span className="flex-1 prism-text-s">{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <FormMessage />
      </FormItem>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create"
              ? "Create Situation Diagram"
              : "Edit Situation Diagram"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new person in the situation with their actions, relations, resources, and channels."
              : "Edit the person's details in the situation diagram."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto space-y-6 px-1"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person/Role Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Surgeon, Student, Manager"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ArrayField
                name="actions"
                label="Actions"
                description="What are the things this person does in this situation?"
              />

              {/* Relationship Connections Field */}
              <FormField
                control={form.control}
                name="relationshipConnections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Connections</FormLabel>
                    <FormDescription>
                      Connect this person to existing people in the situation.
                    </FormDescription>
                    <div className="space-y-2">
                      <Select
                        value=""
                        onValueChange={(personId) => {
                          preserveScrollPosition(() => {
                            if (personId && !field.value.includes(personId)) {
                              field.onChange([...field.value, personId]);
                            }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a person to connect..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingPeople
                            .filter(
                              (person) => !field.value.includes(person.id)
                            )
                            .map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {field.value.length > 0 && (
                        <div className="space-y-1">
                          {field.value.map((personId) => {
                            const person = existingPeople.find(
                              (p) => p.id === personId
                            );
                            return (
                              <div
                                key={personId}
                                className="flex items-center gap-2 bg-muted p-2 rounded"
                              >
                                <span className="flex-1 prism-text-s">
                                  Connected to: {person?.title || personId}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    preserveScrollPosition(() => {
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== personId
                                        )
                                      );
                                    });
                                  }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ArrayField
                name="relations"
                label="Other relations"
                description="Who else is involved and what do they do to support this person?"
              />

              <ArrayField
                name="resources"
                label="Resources"
                description="What tools, products, or services does this person use?"
              />

              <ArrayField
                name="channels"
                label="Channels"
                description="How do actions, people, and resources connect or communicate?"
              />
            </div>

            <DialogFooter className="flex-shrink-0 mt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

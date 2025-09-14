"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import { Input } from "@prism/ui/components/input";
import { Textarea } from "@prism/ui/components/textarea";
import { Edit, Save, X } from "lucide-react";

interface CollectionInfoCardProps {
  initialName: string;
  initialDescription?: string;
  onSave: (data: { name: string; description: string }) => void;
}

export function CollectionInfoCard({
  initialName,
  initialDescription = "",
  onSave,
}: CollectionInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [editingName, setEditingName] = useState(initialName);
  const [editingDescription, setEditingDescription] =
    useState(initialDescription);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setEditingName(initialName);
    setEditingDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleStartEdit = () => {
    setEditingName(name);
    setEditingDescription(description);
    setIsEditing(true);
  };

  const handleSave = () => {
    setName(editingName);
    setDescription(editingDescription);
    onSave({ name: editingName, description: editingDescription });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingName(name);
    setEditingDescription(description);
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <CardTitle className="prism-text-l-semibold">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Enter a name for this collection"
              />
            </CardTitle>
          ) : (
            <CardTitle className="prism-text-l-semibold">
              {name || "Untitled"}
            </CardTitle>
          )}
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Describe the collection context or purpose"
                className="min-h-24 resize-none"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {description ? (
              <p className="prism-text-m text-muted-foreground whitespace-pre-wrap">
                {description}
              </p>
            ) : (
              <p className="prism-text-m text-muted-foreground/60 italic">
                No description yet. Click edit to add one.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

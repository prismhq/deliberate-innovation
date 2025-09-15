"use client";

import { memo } from "react";
import { type NodeProps, Handle, Position } from "@reactflow/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Badge } from "@prism/ui/components/badge";
import { Button } from "@prism/ui/components/button";
import { Edit, Trash2 } from "lucide-react";

export interface SituationDiagramData {
  id: string;
  title: string;
  actions: string[];
  relations: string[];
  resources: string[];
  channels: string[];
}

export interface SituationDiagramNodeProps extends NodeProps {
  data: SituationDiagramData & {
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  };
}

export const SituationDiagramNode = memo(
  ({ data, selected }: SituationDiagramNodeProps) => {
    const {
      id,
      title,
      actions,
      relations,
      resources,
      channels,
      onEdit,
      onDelete,
    } = data;

    return (
      <div
        className={`min-w-80 rounded-lg ${selected ? "ring-2 ring-primary" : ""}`}
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#555' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#555' }}
        />

        <Card className="bg-background/95 backdrop-blur-sm shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="prism-text-m-semibold">{title}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(id)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actions Section */}
            {actions.length > 0 && (
              <div>
                <h4 className="prism-text-s-semibold text-muted-foreground mb-2">
                  Actions
                </h4>
                <div className="flex flex-wrap gap-1">
                  {actions.slice(0, 3).map((action, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="prism-text-xs"
                    >
                      {action}
                    </Badge>
                  ))}
                  {actions.length > 3 && (
                    <Badge variant="outline" className="prism-text-xs">
                      +{actions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Relations Section */}
            {relations.length > 0 && (
              <div>
                <h4 className="prism-text-s-semibold text-muted-foreground mb-2">
                  Relations
                </h4>
                <div className="flex flex-wrap gap-1">
                  {relations.slice(0, 3).map((relation, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="prism-text-xs"
                    >
                      {relation}
                    </Badge>
                  ))}
                  {relations.length > 3 && (
                    <Badge variant="outline" className="prism-text-xs">
                      +{relations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Resources Section */}
            {resources.length > 0 && (
              <div>
                <h4 className="prism-text-s-semibold text-muted-foreground mb-2">
                  Resources
                </h4>
                <div className="flex flex-wrap gap-1">
                  {resources.slice(0, 3).map((resource, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="prism-text-xs"
                    >
                      {resource}
                    </Badge>
                  ))}
                  {resources.length > 3 && (
                    <Badge variant="outline" className="prism-text-xs">
                      +{resources.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Channels Section */}
            {channels.length > 0 && (
              <div>
                <h4 className="prism-text-s-semibold text-muted-foreground mb-2">
                  Channels
                </h4>
                <div className="flex flex-wrap gap-1">
                  {channels.slice(0, 3).map((channel, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="prism-text-xs"
                    >
                      {channel}
                    </Badge>
                  ))}
                  {channels.length > 3 && (
                    <Badge variant="outline" className="prism-text-xs">
                      +{channels.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Show message if no content */}
            {actions.length === 0 &&
              relations.length === 0 &&
              resources.length === 0 &&
              channels.length === 0 && (
                <div className="text-center text-muted-foreground prism-text-s">
                  Click edit to add details
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

SituationDiagramNode.displayName = "SituationDiagramNode";

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCollection } from "./collection-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import { api } from "~/trpc/react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Panel,
  type Node,
} from "@reactflow/core";
import { Controls } from "@reactflow/controls";
import { MiniMap } from "@reactflow/minimap";
import "@reactflow/core/dist/style.css";
import { CollectionInfoCard } from "~/components/workspace/collection-info-card";
import {
  SituationDiagramNode,
  type SituationDiagramData,
} from "~/components/situation-diagrams/situation-diagram-node";
import { SituationDiagramDialog } from "~/components/situation-diagrams/situation-diagram-dialog";

const nodeTypes = {
  situationDiagram: SituationDiagramNode,
};

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();
  const utils = api.useUtils();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiagram, setEditingDiagram] =
    useState<SituationDiagramData | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Track next position for new nodes
  const nextPositionRef = useRef({ x: 100, y: 100 });

  // Fetch situation diagrams
  const { data: situationDiagrams, refetch } =
    api.situationDiagrams.getByCollectionId.useQuery(
      { collectionId },
      { enabled: !!collectionId }
    );

  // Mutations
  const createDiagram = api.situationDiagrams.create.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const updateDiagram = api.situationDiagrams.update.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const deleteDiagram = api.situationDiagrams.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Update collection description for situation context
  const updateCollection = api.collections.update.useMutation({
    onSuccess: () => {
      void utils.collections.getById.invalidate({ collectionId });
    },
  });

  // Stabilize mutation functions across renders to avoid effect churn
  const deleteDiagramMutateRef = React.useRef(deleteDiagram.mutate);
  React.useEffect(() => {
    deleteDiagramMutateRef.current = deleteDiagram.mutate;
  }, [deleteDiagram.mutate]);

  const updateDiagramMutateRef = React.useRef(updateDiagram.mutate);
  React.useEffect(() => {
    updateDiagramMutateRef.current = updateDiagram.mutate;
  }, [updateDiagram.mutate]);

  type SituationDiagramRecord = {
    id: string;
    title: string;
    actions: string[];
    relations: string[];
    resources: string[];
    channels: string[];
    positionX: number;
    positionY: number;
  };

  // Note: delete is handled inline in node data to avoid stale closures

  // Update nodes when data changes
  React.useEffect(() => {
    if (situationDiagrams) {
      const newNodes = (situationDiagrams as SituationDiagramRecord[]).map(
        (diagram) => ({
          id: diagram.id,
          type: "situationDiagram",
          position: { x: diagram.positionX, y: diagram.positionY },
          data: {
            id: diagram.id,
            title: diagram.title,
            actions: diagram.actions,
            relations: diagram.relations,
            resources: diagram.resources,
            channels: diagram.channels,
            onEdit: (id: string) => {
              const diagram = (
                situationDiagrams as SituationDiagramRecord[] | undefined
              )?.find((d) => d.id === id);
              if (diagram) {
                setEditingDiagram(diagram);
                setDialogMode("edit");
                setDialogOpen(true);
              }
            },
            onDelete: (id: string) => {
              if (
                confirm(
                  "Are you sure you want to delete this situation diagram?"
                )
              ) {
                deleteDiagramMutateRef.current({ id });
              }
            },
          },
        })
      );
      setNodes(newNodes);
    }
  }, [situationDiagrams, setNodes]);

  const handleCreateDiagram = () => {
    setEditingDiagram(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleSaveDiagram = (
    data: Omit<SituationDiagramData, "id">,
    relationshipConnections?: string[]
  ) => {
    if (dialogMode === "create") {
      createDiagram.mutate(
        {
          ...data,
          collectionId,
          positionX: nextPositionRef.current.x,
          positionY: nextPositionRef.current.y,
        },
        {
          onSuccess: (newDiagram) => {
            // Create edges for relationship connections
            if (relationshipConnections && relationshipConnections.length > 0) {
              const newEdges = relationshipConnections.map((targetId) => ({
                id: `${newDiagram.id}-${targetId}`,
                source: newDiagram.id,
                target: targetId,
                type: "default",
              }));
              setEdges((prevEdges) => [...prevEdges, ...newEdges]);
            }
          },
        }
      );
      // Update next position
      nextPositionRef.current = {
        x: nextPositionRef.current.x + 50,
        y: nextPositionRef.current.y + 50,
      };
    } else if (editingDiagram) {
      updateDiagram.mutate({
        id: editingDiagram.id,
        ...data,
      });
    }
  };

  // Handle node position changes
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    updateDiagramMutateRef.current({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    });
  }, []);

  const handleSaveCollectionInfo = (data: {
    name: string;
    description: string;
  }) => {
    if (collection) {
      updateCollection.mutate({
        collectionId: collection.id,
        name: data.name,
        description: data.description,
      });
    }
  };

  const existingPeople =
    situationDiagrams
      ?.filter((d) => d.id !== editingDiagram?.id)
      .map((d) => ({ id: d.id, title: d.title })) || [];

  // Memoized options must be defined before any early returns to satisfy Hooks rules
  const fitViewOptions = React.useMemo(
    () => ({ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }),
    []
  );
  const proOptions = React.useMemo(() => ({ hideAttribution: true }), []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-[var(--spacing-xl)]">
        <Card>
          <CardHeader>
            <CardTitle>Collection Not Found</CardTitle>
            <CardDescription>
              The requested collection could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/workspace">Back to Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="relative flex-1 min-h-0 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          proOptions={proOptions}
          elementsSelectable={true}
          nodesConnectable={false}
          connectOnClick={false}
        >
          <Panel position="top-center">
            <CollectionInfoCard
              initialName={collection.name || ""}
              initialDescription={collection.description || ""}
              onSave={handleSaveCollectionInfo}
              onAddPerson={handleCreateDiagram}
            />
          </Panel>
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Dialog */}
      <SituationDiagramDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveDiagram}
        initialData={editingDiagram || undefined}
        mode={dialogMode}
        existingPeople={existingPeople}
      />
    </div>
  );
}

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
  type Edge,
} from "@reactflow/core";
import { Controls } from "@reactflow/controls";
import { MiniMap } from "@reactflow/minimap";
import {
  StraightEdge,
  StepEdge,
  SmoothStepEdge,
  BezierEdge,
} from "@reactflow/core";
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

  // Update nodes and edges when data changes
  React.useEffect(() => {
    if (situationDiagrams) {
      const diagrams = situationDiagrams as SituationDiagramRecord[];

      const newNodes = diagrams.map((diagram) => ({
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
              confirm("Are you sure you want to delete this situation diagram?")
            ) {
              deleteDiagramMutateRef.current({ id });
            }
          },
        },
      }));

      // Helper function to calculate the best handle based on relative positions
      const getBestHandles = (sourceNode: SituationDiagramRecord, targetNode: SituationDiagramRecord) => {
        const dx = targetNode.positionX - sourceNode.positionX;
        const dy = targetNode.positionY - sourceNode.positionY;

        // Calculate the angle between nodes
        const angle = Math.atan2(dy, dx);
        const degrees = (angle * 180) / Math.PI;

        // Determine best source and target handles based on angle
        let sourceHandle, targetHandle;

        if (degrees >= -45 && degrees < 45) {
          // Target is to the right
          sourceHandle = "right-source";
          targetHandle = "left";
        } else if (degrees >= 45 && degrees < 135) {
          // Target is below
          sourceHandle = "bottom-source";
          targetHandle = "top";
        } else if (degrees >= 135 || degrees < -135) {
          // Target is to the left
          sourceHandle = "left-source";
          targetHandle = "right";
        } else {
          // Target is above
          sourceHandle = "top-source";
          targetHandle = "bottom";
        }

        return { sourceHandle, targetHandle };
      };

      // Create edges based on relations array
      const newEdges: Edge[] = [];

      diagrams.forEach((sourceDiagram) => {
        sourceDiagram.relations.forEach((relationTitle) => {
          const targetDiagram = diagrams.find(
            (d) => d.title === relationTitle && d.id !== sourceDiagram.id
          );

          if (targetDiagram) {
            const edgeId = `${sourceDiagram.id}-${targetDiagram.id}`;
            // Avoid duplicate edges
            if (!newEdges.some((edge) => edge.id === edgeId)) {
              const { sourceHandle, targetHandle } = getBestHandles(sourceDiagram, targetDiagram);

              newEdges.push({
                id: edgeId,
                source: sourceDiagram.id,
                target: targetDiagram.id,
                sourceHandle,
                targetHandle,
                type: "default",
              });
            }
          }
        });
      });
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [situationDiagrams, setNodes, setEdges]);

  const handleCreateDiagram = () => {
    setEditingDiagram(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleSaveDiagram = (
    data: Omit<SituationDiagramData, "id">,
    relationshipConnections?: string[]
  ) => {
    // Add connected node titles to relations array
    let updatedRelations = [...(data.relations || [])];
    if (relationshipConnections && relationshipConnections.length > 0) {
      const connectedTitles = relationshipConnections
        .map((targetId) => {
          const targetDiagram = (
            situationDiagrams as SituationDiagramRecord[]
          )?.find((d) => d.id === targetId);
          return targetDiagram?.title;
        })
        .filter(Boolean) as string[];

      // Add connected titles to relations array, avoiding duplicates
      connectedTitles.forEach((title) => {
        if (!updatedRelations.includes(title)) {
          updatedRelations.push(title);
        }
      });
    }

    const finalData = {
      ...data,
      relations: updatedRelations,
    };

    if (dialogMode === "create") {
      createDiagram.mutate({
        ...finalData,
        collectionId,
        positionX: nextPositionRef.current.x,
        positionY: nextPositionRef.current.y,
      });
      // Update next position
      nextPositionRef.current = {
        x: nextPositionRef.current.x + 50,
        y: nextPositionRef.current.y + 50,
      };
    } else if (editingDiagram) {
      updateDiagram.mutate({
        id: editingDiagram.id,
        ...finalData,
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
      <div
        className="relative flex-1 min-h-0 w-full"
        style={{ height: "100vh" }}
      >
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

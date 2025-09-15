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
import { Plus } from "lucide-react";
import { api } from "~/trpc/react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  type Connection,
  type Edge,
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

  // Convert database diagrams to React Flow nodes
  const convertToNodes = useCallback((diagrams: typeof situationDiagrams) => {
    if (!diagrams) return [];

    return diagrams.map((diagram: any) => ({
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
        onEdit: handleEditDiagram,
        onDelete: handleDeleteDiagram,
      },
    }));
  }, []);

  // Update nodes when data changes
  React.useEffect(() => {
    if (situationDiagrams) {
      setNodes(convertToNodes(situationDiagrams));
    }
  }, [situationDiagrams, convertToNodes, setNodes]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleCreateDiagram = () => {
    setEditingDiagram(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditDiagram = useCallback(
    (id: string) => {
      const diagram = situationDiagrams?.find((d: any) => d.id === id);
      if (diagram) {
        setEditingDiagram(diagram);
        setDialogMode("edit");
        setDialogOpen(true);
      }
    },
    [situationDiagrams]
  );

  const handleDeleteDiagram = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this situation diagram?")) {
        deleteDiagram.mutate({ id });
      }
    },
    [deleteDiagram]
  );

  const handleSaveDiagram = (data: Omit<SituationDiagramData, "id">) => {
    if (dialogMode === "create") {
      createDiagram.mutate({
        ...data,
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
        ...data,
      });
    }
  };

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateDiagram.mutate({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
      });
    },
    [updateDiagram]
  );

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

  if (isLoading) {
    return (
      <div className="prism-loading-state">
        <div className="prism-loading-text">Loading collection...</div>
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
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          className="relative z-10 bg-transparent h-full w-full"
          style={{ width: "100%", height: "100%" }}
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
      />
    </div>
  );
}

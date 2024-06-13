"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";

export type TableData = {
  id: string;
  title: string;
  recipient: string;
  requester: string;
  progress: number;
  updatedAt: string;
};

export const columns: ColumnDef<TableData>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "recipient", header: "Recipient" },
  { accessorKey: "requester", header: "Requester" },
  { accessorKey: "updatedAt", header: "Updated" },
  {
    // id: "actions",
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      return (
        // row.original.progress && (
        <div className="text-center">
          <p>{row.original.progress}%</p>
          <Progress className="bag-red-400" value={row.original.progress} />
        </div>
        // )
      );
    },
  },
];

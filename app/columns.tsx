"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Progress } from "@/components/ui/progress"

export type Payment = 
{
  id: string;
  userId: string;
  title: string;
  to: string;
  from: string;
  code: number;
  createdAt: string; 
  updatedAt: string;
};

export const columns: ColumnDef<Payment>[] =[
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'recipient', header: 'Recipient' },
  { accessorKey: 'requester', header: 'Requester' },
  { accessorKey: 'updatedAt', header: 'Updated' },
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

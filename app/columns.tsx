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
  // { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'recipient', header: 'Recipient' },
  { accessorKey: 'requester', header: 'Requester' },
  { accessorKey: 'updatedAt', header: 'Updated' },
  // { accessorKey: 'progress', header: 'Progress' },
  {
    // id: "actions",
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const q = row.original.progress === 0 ? row.original.progress+30: row.original.progress-22
      return (
        // row.original.progress && (
          <div className="text-center">
            <p>{row.original.progress === 0 ? row.original.progress+30: row.original.progress-22}%</p>
            {/* <Progress className="bag-red-400" value={row.original.progress} /> */}
            <Progress className="bag-red-400" value={q} />

          </div>
        // )
      );
    },
  },
];
// title, recipient, requester, due???, updated, progress
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Paperclip } from "lucide-react";
import { CircleX, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  index: string;
  item: string;
  recipient: string;
  size: string;
  url: string;
};
export type Popup = {
  item: string;
  required: boolean;
  attachment: boolean;
};

function downloadFile(url: string, filename: string) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => console.error("Error downloading file:", error));
}

export const columns: ColumnDef<Payment>[] = [
  { accessorKey: "index", header: "#" },
  { accessorKey: "item", header: "ITEM" },
  { accessorKey: "recipient", header: "RECIPIENT" },
  { accessorKey: "size", header: "SIZE" },
  {
    id: "actions",
    accessorKey: "download",
    // header: "DOWNLOAD",
    header: () => <div className="text-center">DOWNLOAD</div>,
    cell: ({ row }) => {
      return (
        row.original.index === "" && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                downloadFile(row.original?.url, row.original.item);
              }}
              className="h-8 w-8 p-0"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        )
      );
    },
  },
  // {
  //   id: "actions",
  //   accessorKey: "delete",
  //   header: "DELETE",
  //   cell: ({ row }) => {
  //     return (
  //       row.original.index === "" && (
  //         <div className="text-center">
  //           <Button variant="ghost" onClick={() => {
  //             console.log('DELETED', row.original)
  //           }} className="h-8 w-8 p-0">
  //             <CircleX className="h-5 w-5" />
  //           </Button>
  //         </div>
  //       )
  //     );
  //   },
  // },
];
export const popup: ColumnDef<Popup>[] = [
  { accessorKey: "item", header: "" },
  {
    id: "actions",
    accessorKey: "required",
    header: "",
    cell: ({ row }) => {
      return (
        !row.original.required && (
          <div className="text-center">
            <p>Optional</p>
          </div>
        )
      );
    },
  },
  {
    id: "actions",
    accessorKey: "attachment",
    header: "",
    cell: ({ row }) => {
      return (
        row.original.attachment && (
          <div className="text-center">
            <Paperclip className="h-5 w-5" />
          </div>
        )
      );
    },
  },
];

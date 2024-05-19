import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import axios from "axios";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if (!user) redirect("/sign-up");

  function formatDate(dateString) {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    
    const date = new Date(dateString);
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    
    return `${month} ${day}`;
  }

  const res = await axios.get(`http://127.0.0.1:3000/api/user/${user.id}`);
  const data = res.data.form.map((f: any) => {
    let req=0, total=0;

    f.fields.forEach((field) => {
      if (field.required) total += 1;
      if (field.required && field.attachments.length > 0) req += 1;
    });
    // setStatus(
    //   req === total ? "Completed" : req === 0 ? "Not Started" : "In Progress"
    // );

    return {
      // id: f.id,
      // userId: f.userId,
      title: f.title,
      recipient: f.recipientName,
      requester: f.userName,
      updatedAt: formatDate(f.updatedAt),
      progress: (req/total)*100,
    };
  });
  // { accessorKey: 'title', header: 'Title' },
  // { accessorKey: 'recipient', header: 'Recipient' },
  // { accessorKey: 'requester', header: 'Requester' },
  // { accessorKey: 'updatedAt', header: 'Updated' },
  // { accessorKey: 'progress', header: 'Progress' },

  console.log("first", res.data, data);

  return (
    <div className="flex ">
      <div className="">
        <Link href="/create">
          <Button className="bg-blue-800">Create Request</Button>
        </Link>
      </div>
      <div className="">
        <h1>Current Requests</h1>
        <div className="container mx-auto py-10">
          <DataTable columns={columns} data={Array(99).fill(data).flat()} />
        </div>
      </div>
    </div>
  );
}

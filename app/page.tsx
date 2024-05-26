"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const { userId } = useAuth();
  const [data, setData] = useState([]);

  if (!userId) redirect("/sign-up");

  const getData = async () => {
    const res = await axios.get(`/api/user/${userId}`);
    const values = res.data.form.map((f: any) => {
      let req = 0,
        total = 0;

      f.fields.forEach((field) => {
        if (field.required) total += 1;
        if (field.required && field.attachments.length > 0) req += 1;
      });
      return {
        id: f.id,
        title: f.title,
        recipient: f.recipientName,
        requester: f.userName,
        updatedAt: formatDate(f.updatedAt),
        progress: (req / total) * 100,
      };
    });
    setData(values);
    console.log("first", res.data, values);
  };

  useEffect(() => {
    getData();
  }, []);
  return (
    <div className="flex flex-col items-center">
      <Link href="/create">
        <Button className="bg-blue-800 w-[300px]">Create Request</Button>
      </Link>
      <div className="container mx-auto py-10">
        {data && <DataTable columns={columns} data={data} />}
      </div>
    </div>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import JSZip from "jszip";

import { Payment, columns, popup } from "./columns";
import { DataTable } from "./data-table";
import { DataTable2 } from "./data-table2";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

import axios from "axios";
import { redirect } from "next/navigation";
import { CircleX, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { comment } from "postcss";
import { Document } from "@prisma/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function Page({ params }: { params: { requestId: string } }) {
  const [data, setData] = useState([]);
  const [popupData, setPopupData] = useState([]);
  const [res, setRes] = useState();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<
    "Completed" | "In Progress" | "Not Started"
  >("Not Started");
  const [comments, setComments] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const { userId } = useAuth();
  console.log("user", userId);
  if (!userId) redirect("/sign-up");

  function bytesToKB(bytes: number) {
    const kb = Math.round(bytes / 1024);
    return kb + " KB";
  }
  const getData = async () => {
    const res = await axios.get(`/api/form/${params.requestId}`);
    const recipient = res.data.to;
    setRes(res.data);
    setTitle(res.data.title);
    console.log(title, res.data.title);

    function transformArray(arr: []) {
      return arr.map((item) => ({
        index: "",
        item: item.name,
        recipient: recipient,
        size: bytesToKB(item.size),
        url: item.url,
      }));
    }
    const pd = res.data.fields.map((f) => ({
      item: f.name,
      required: f.required,
      attachment: f.attachments.length > 0,
    }));
    // setPopupData(Array(9).fill(pd).flat());
    // setComments(Array(Array(9).fill(pd).flat().length).fill(""));
    setPopupData(pd);
    setComments(Array(pd.length).fill(""));
    console.log("pd", pd);
    const data = res.data.fields.flatMap((f: any, i) => {
      const a = transformArray(f.attachments);
      return [
        {
          index: `${i + 1}.`,
          item: f.name,
          recipient: "",
          size: "",
        },
        ...a,
      ];
    });

    let req = 0,
      total = 0;
    res.data.fields.forEach((field) => {
      if (field.required) total += 1;
      if (field.required && field.attachments.length > 0) req += 1;
    });
    setStatus(
      req === total ? "Completed" : req === 0 ? "Not Started" : "In Progress"
    );
    setData(data);
    console.log("RESPONSE", res.data, res.data.fields[2]);
    console.log("qwertyui", data);
  };

  async function downloadFiles(files) {
    const zip = new JSZip();

    const promises = files.map((file) => {
      return fetch(file.url)
        .then((response) => response.blob())
        .then((blob) => {
          zip.file(file.item, blob);
          return file.item;
        })
        .catch((error) =>
          console.error(`Error downloading ${file.item}:`, error)
        );
    });

    Promise.all(promises).then((val) => {
      console.log("prom", val);
      zip.generateAsync({ type: "blob" }).then((content) => {
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        console.log(title);
        a.download = `${title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    });
  }

  const handleSubmit = async () => {
    try {
      if (comments.every((x) => x.length === 0)) return;
      const promises = [];
      comments.forEach((comment, index) => {
        if (comment.length > 0) {
          // const reply = await axios.patch(
          promises.push({
            id: res?.fields[index].id,
            comment: comment,
          });
          // console.log('REPLY', reply)
        }
      });
      const q = await axios.patch(`/api/form/${res?.id}/comments`, promises);
      console.log("process", promises, q);
      toast.success("Comments send successfully");
      // Promise.all(promises).then((val) => {
      //   console.log("prom", val);
      //   // console.log('empty')
      // });
    } catch (error) {
      console.log("done for", error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const att = data.filter((v) => v.url);
  console.log("first", att);
  console.log("dATA", res);

  return (
    <div className="flex flex-col items-center">
      <div className="text-center bg-white border border-black w-fit py-8 px-16 rounded-lg">
        <h1 className="text-2xl font-medium">
          Request Status:{" "}
          <span
            className={`underline ${
              status === "Completed"
                ? "text-green-500"
                : status === "In Progress"
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {status}
          </span>
        </h1>
        <div className="mt-6 flex flex-col gap-y-2">
          <h3 className="text-xl font-medium">
            Submitted: {res?.updatedAt && formatDate(res?.updatedAt)}
          </h3>
          <h3 className="text-xl font-medium">Owner: {res?.userName}</h3>
          <h3 className="text-xl font-medium">
            Recipient: {res?.recipientName}
          </h3>
        </div>
      </div>
      <div className="w-full">
        <div className="container mx-auto py-10">
          <div className="flex justify-between my-4">
            <Dialog className="w-[900px]">
              <DialogTrigger asChild>
                <Button variant="destructive">Request Changes</Button>
              </DialogTrigger>

              <DialogContent className="min-w-[800px] p-8">
                <div className="flex gap-x-8">
                  <div className="">
                    <h3 className="text-xl font-medium">Request Changes from:</h3>
                    <h1 className="text-4xl font-bold">{res?.recipientName}</h1>
                    <h5 className="text-xl font-semibold">{res?.to}</h5>
                    {data.length > 0 && (
                      <DataTable2
                        columns={popup}
                        data={popupData}
                        selected={selected}
                        comments={comments}
                        setSelected={setSelected}
                        setComment={setComment}
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-medium">{res?.fields[selected].name}</h2>
                    <div className="">
                      {res?.fields[selected].attachments.map((val) => (
                        <p className="text-sm  font-medium text-">{val.name}</p>
                      ))}
                    </div>
                    <h2 className="text-xl font-medium mt-4">Add Comments</h2>
                    <div className="">
                      <Textarea
                      className="w-full h-[200px]"
                        value={comment}
                        onChange={(e) => {
                          setComment(e.target.value);
                          setComments((prevComments) => {
                            const updatedComments = [...prevComments];
                            updatedComments[selected] = e.target.value;
                            return updatedComments;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex !justify-center mt-4">
                  <Button onClick={handleSubmit} type="submit">
                    Send
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => downloadFiles(att)}>
              Download All <Download className="ml-1 w-4" />
            </Button>
          </div>
          {data.length > 0 && <DataTable columns={columns} data={data} />}
        </div>
      </div>
    </div>
  );
}

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
    <div className="flexa ">
      <div className="">
        <h1> Request Status: {status}</h1>
        <div className="">
          {/* <h3>Submitted: </h3> */}
          <h3>Owner: {res?.userName}</h3>
          <h3>Recipient: {res?.recipientName}</h3>
        </div>
      </div>
      <div className="">
        <h1>Requests Changes</h1>
        <div className="container mx-auto py-10">
          <div className="flex justify-between my-4">
            {/* <Dialog className="bg-red-400">
              <DialogTrigger className="bg-red-400 text-left">Open</DialogTrigger>
              <DialogContent className="bag-red-400 text-left">
                <DialogHeader className="bg-red-400 text-left">
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog> */}
            {/*  */}
            <Dialog>
              <DialogTrigger asChild>
                {/* <Button variant="outline">Continue</Button> */}
                <Button variant="destructive">Request Changes</Button>
              </DialogTrigger>
              {/* <DialogPortal> */}
              {/* <DialogOverlay> */}
              <DialogContent className=" w-[900px]">
                {/* <DialogHeader className="text-left">
                      <DialogTitle>Request Changes from:</DialogTitle>
                      <DialogDescription>
                        Make changes to your profile here. Click save when
                        you're done.
                      </DialogDescription>
                    </DialogHeader> */}
                {/* from, to, msg, auth */}
                {/* <div className="grid gap-4"> */}
                <div className="flex">
                  <div className="">
                    <h3>Request Changes from:</h3>
                    <h1>{res?.recipientName}</h1>
                    <h5>{res?.to}</h5>
                    {/* <DataTable    /> */}
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
                  <div className="">
                    <h2>{res?.fields[selected].name}</h2>
                    {/* list of docs */}
                    <div className="">
                      {res?.fields[selected].attachments.map((val) => (
                        <p>{val.name}</p>
                      ))}
                    </div>
                    <h2>Add Comments</h2>
                    <div className="">
                      <Textarea
                        value={comment}
                        onChange={(e) => {
                          setComment(e.target.value);
                          console.log("area", e.target.value);
                          setComments((prevComments) => {
                            const updatedComments = [...prevComments]; // Create a shallow copy of the original array
                            updatedComments[selected] = e.target.value; // Update the value at the selected index
                            return updatedComments; // Return the updated array
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex !justify-center ">
                  {/* <DialogClose asChild className="">
                    <Button type="button">Close</Button>
                  </DialogClose> */}
                  {/* <Button
                    // onClick={hookform.handleSubmit(onSubmit, onErr)}
                    onClick={() => {
                      console.log("qqq",res);
                    }}
                  >
                    clg
                  </Button> */}
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
          {data.length > 0 && (
            // <DataTable columns={columns} data={Array(9).fill(data).flat()} />
            <DataTable columns={columns} data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

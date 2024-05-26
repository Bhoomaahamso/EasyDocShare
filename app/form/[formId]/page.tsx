"use client";

import FormElement from "@/components/elements/FormElement";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { number, z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CircleX, Cross, CrossIcon, MessageCircleWarning } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { Field } from "@prisma/client";
import { useBeforeunload } from "react-beforeunload";
import { useSearchParams } from "next/navigation";
import { sendMail } from "@/email/sendMail";
import { toast } from "sonner";

const formSchema = z.object({
  dynamicFields: z
    .object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
    })
    .array()
    .nonempty(),
});

function page({ params }: { params: { formId: string } }) {
  const [view, setView] = useState(false);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);

  const { userId } = useAuth();
  const idd = params.formId;
  // const idd = "9fe666b6-307a-4ae4-a68a-c6ee4df21586";
  console.log("user", userId, idd, params.formId);

  const hookform = useForm<z.infer<typeof formSchema>>({
    // resolver: zodResolver(formSchema),
    // defaultValues: async () => (await axios('/api/form/41701864-06d4-4039-9199-07984de498db')).data
    defaultValues: async () => {
      try {
        const res = await axios("/api/form/" + idd);
        // const data = JSON.parse(JSON.stringify(res.data))
        // res.data.fields.forEach((field) => (field.attachments = []));
        console.log("found", res);
        return res.data;
      } catch (error) {
        console.log("def error", error);
      }
    },
    // defaultValues: {
    //   title: "",
    //   from: "",
    //   to: "",
    //   message: "",
    //   dynamicFields: [{ name: "", description: "", required: true }],
    // },
  });

  const { fields, append, remove } = useFieldArray({
    control: hookform.control,
    name: "dynamicFields",
  });

  async function getData() {
    const val = await axios("/api/form/" + idd);
    // const val = await axios('/api/form/41701864-06d4-4039-9199-07984de498db')
    // hookform.reset(val.data)

    // console.log("vaL", val);
  }
  useEffect(() => {
    setView(true);
    getData();
  }, []);

  const deleteAttachment = async (id) => {
    const data = await axios.delete(`/api/form/${idd}/attachment/${id}`);
    console.log("delete", data);
    hookform.setValue(
      `fields.${selected}.attachments`,
      hookform.getValues().fields[selected].attachments.filter((val) => {
        return val.key !== id;
      })
    );
  };

  if (!view) return;

  const df: Field[] = hookform.watch("fields");
  const requireds = df?.filter((v) => v.required).length;
  const done = df?.filter((v) => v.required && v.attachments.length > 0).length;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // DO EMPTY FORM SUBMIT CHECK
      console.log("submit", values);

      const res = await axios.post("/api/mail", {
        id: values.id,
      });
      console.log("mailsend", res);
      toast.success("Form submitted successfully.");
    } catch (error) {
      console.log("ERROR:", error);
      toast.error("Something went wrong");
    }
  }
  function onErr(values: any) {
    console.log("errr", values, hookform.formState.errors);
  }

  return (
    <Form {...hookform}>
      <form
        onSubmit={hookform.handleSubmit(onSubmit, onErr)}
        className="flex p-4 h-[95vh] justify-center"
      >
        <div className="grid grid-cols-[3fr_1fr] grid-rows-[9fr_1fr] gap-x-12 gap-y-8 h-full">
          <div className="flex flex-col p-8 bg-white">
            <div className="">
              <h1 className="text-lg font-medium pl-4">
                {selected + 1 + ". "}
                {hookform.getValues().fields?.[selected].name}
              </h1>
              <h3 className="text-base font-medium pl-4">
                {hookform.getValues().fields?.[selected].description}
              </h3>
            </div>
            <UploadDropzone
              className="h-[400px] cursor-pointer"
              endpoint="imageUploader"
              onClientUploadComplete={async function (res) {
                try {
                  console.log(
                    "Files: ",
                    hookform.getValues().fields[selected],
                    res
                  );
                  hookform.setValue(`fields.${selected}.attachments`, [
                    ...hookform.getValues().fields[selected].attachments,
                    ...res,
                  ]);
                  setFiles([...files, ...res]);
                  const data = await axios.patch("/api/form/" + idd, {
                    files: res,
                    form: hookform.getValues().fields[selected],
                  });
                  console.log("ssh", data);
                } catch (error) {
                  console.log("UPLOAD_FORM", error);
                }
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                alert(`ERROR! ${error.message}`);
              }}
              onUploadBegin={(name) => {
                // Do something once upload begins

                console.log("Uploading: ", name);
                return;
              }}
              onBeforeUploadBegin={(files) => {
                console.log("onbeforeUploadBegin", files);
                // throw new Error('d')
                return files;
              }}
            />
            <div className="mt-8">
              {df?.[selected]?.attachments.map((file) => {
                return (
                  <div className="flex items-center text-sm gap-x-4 mb-1">
                    <p>{file.name}</p>
                    <span>
                      <CircleX
                        color="#b61a1a"
                        size={20}
                        onClick={() => deleteAttachment(file.key)}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* list */}
          <div className=" bg-white w-60">
            <h1 className="text-xl font-medium pl-4 my-4">Checklist</h1>
            <h3 className="text-base font-medium pl-4 my-4">
              ({done}/{requireds} Required Item{requireds > 1 && "s"})
            </h3>
            {df?.map((val, i) => (
              <div
                className={`flex justify-between hover:bg-[#f2f2f5] cursor-pointer ${
                  i == selected && "bg-[#f2f2f5]"
                }`}
                onClick={() => {
                  setSelected(i);
                }}
              >
                <FormField
                  control={hookform.control}
                  name={`fields.${i}`}
                  render={({ field }) => (
                    <FormItem className="">
                      <div className="flex items-center justify-between py-4 gap-x-4">
                        <FormLabel className="text-sm font-medium pl-4">
                          {i + 1} {field.value.name}
                        </FormLabel>
                        {!field.value.required && (
                          <p className="text-[#5c77d1] font-semibold bg-[#dfecfc] rounded-full px-2">
                            Optional
                          </p>
                        )}
                        {field.value.comment && (
                          <Dialog>
                            <DialogTrigger>
                              <MessageCircleWarning
                                size={36}
                                color="#f70202"
                                className="hover:bg-red-200 rounded-full cursor-pointer p-1 "
                              />
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{field.value.comment}</DialogTitle>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* <button type="button" onClick={() => remove(i)}>
                          <CircleX color="#ff0000" />
                        </button> */}
                      </div>
                      {/* select */}
                      {/* <FormLabel>Item Name</FormLabel> */}
                      {/* <FormControl>
                        {/* <Input placeholder="Item Name" {...field} /> * /}
                      </FormControl> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
          {/* btn */}
          <div className="col-start-2 text-center">
            <Button className="bg-[#182be2]" type="submit">
              Continue
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
export default page;

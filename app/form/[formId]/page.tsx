"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Check,
  CircleX,
  Cross,
  CrossIcon,
  FileType,
  MessageCircleWarning,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
//import { UploadDropzone } from "@/ /uploadthing";
import { Field } from "@prisma/client";
import { toast } from "sonner";

import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import Test from "@/components/elements/Test";
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

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

function Page({ params }: { params: { formId: string } }) {
  const [view, setView] = useState(false);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);
  const [dateCollector, setDateCollector] = useState([]);  

  const { userId } = useAuth();
  const idd = params.formId;
  console.log("user", userId, idd, params.formId);

  const hookform = useForm<z.infer<typeof formSchema>>({
    // resolver: zodResolver(formSchema),
    // defaultValues: async () => (await axios('/api/form/41701864-06d4-4039-9199-07984de498db')).data
    defaultValues: async () => {
      try {
        const res = await axios("/api/form/" + idd);
        // const data = JSON.parse(JSON.stringify(res.data))
        console.log("found", res.data);
        let val = res.data;
        for (const field of val.fields) {
          if (field.type === "sign") {
            let url = field.docUrl;
            const response = await fetch(url);
            const blob = await response.blob();

            const file = new File([blob], "downloaded.pdf", {
              type: "application/pdf",
            });
            console.log(file);

            field.file = file; // Assign file properly
          }
        }
        console.log("m,", val);
        return val;
        //  return res.data;
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

  // console.log('init anno',hookform.getValues().fields?.[0]?.attachments)
  console.log("init anno", hookform.getValues().fields);
  const [annotations, setAnnotations] = useState(
    hookform.getValues().fields?.[0]?.attachments || []
  );

  const getAnnotations = () => {
    if(JSON.stringify(annotations) === JSON.stringify(hookform.getValues().fields?.[selected]?.attachments)){
      return annotations;
    } else {
      setAnnotations(hookform.getValues().fields?.[selected]?.attachments);
      return hookform.getValues().fields?.[selected]?.attachments;
    }
  }
  const handleOpenChange = (open) => {
    console.log('open',open,dateCollector);
    if(!open) {
      dateCollector.forEach(dateId =>{
        const dateInput = document.getElementById(dateId);
        if (dateInput) {
          dateInput.remove(); // Synchronously removes the element from the DOM
        }
      });
      setDateCollector([]);
    }
  };

  if (!view) return;

  // const df: Field[] = hookform.watch("dynamicFields");
  const df: Field[] = hookform.watch("fields");
  console.log('df:', df)
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
            {hookform.getValues().fields?.[selected].type === "files" ? (
              // {/* standard files */}
              <>
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
                  <div key={file.key} className="flex items-center text-sm gap-x-4 mb-1">
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
            </>
            ) : (
              /// {/* e sign */}
              <div className="w-full h-96 grid place-items-center">
                <div className="grid place-items-center gap-4 w-fit">
                  <Button
                    type="button"
                    onClick={() =>
                      console.log(
                        "q",
                        Date.now(),
                        selected,
                        hookform.getValues().fields?.[selected]
                      )
                    }
                  >
                    nnnn - s{selected} - a{annotations?.length} - hf{hookform.getValues().fields?.[selected]?.attachments.length}
                  </Button>
                  <Dialog onOpenChange={handleOpenChange}>
                    <FileType size={64} />
                    <DialogTrigger>
                      <Button type="button" className="bg-[#182be2]">
                        Click to fill the form
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90vw] max-w-[100vw]">
                      <p>n</p>
                      <Test
                        url={hookform.getValues().fields?.[selected]?.file}
                        //annotations={getAnnotations()} //
                        annotations={hookform.getValues().fields?.[selected]?.attachments}
                        setAnnotations={(arr) => hookform.setValue(`fields.${selected}.attachments`, arr)} //{setAnnotations}
                        pdfIndex={selected}
                        onSave={() => console.log("save")}
                        setDateCollector={setDateCollector}
                        // url={field.value}
                        // annotations={annotations}
                        // setAnnotations={setAnnotations}
                        // pdfIndex={index}
                        // onSave={handleSave}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
          {/* list */}
          <div className=" bg-white w-60">
            <h1 className="text-xl font-medium pl-4 my-4">Checklist</h1>
            <h3 className="text-base font-medium pl-4 my-4">
              ({done}/{requireds} Required Item{requireds > 1 && "s"})
            </h3>
            {df?.map((val, i) => (
              <div
              key={val.id}
                className={`flex justify-between hover:bg-[#f2f2f5] cursor-pointer ${
                  i == selected && "bg-[#f2f2f5]"
                }`}
                onClick={() => {
                  setSelected(i);
                  setAnnotations(hookform.getValues().fields?.[i]?.attachments || []);
                  console.log("annnnn",i,selected,hookform.getValues().fields?.[i]?.attachments);
                }}
              >
                <FormField
                  control={hookform.control}
                  name={`fields.${i}`}
                  render={({ field }) => (
                    <FormItem className="">
                      <div className="flex items-center justify-between py-4 gap-x-4">
                        <FormLabel className="text-sm font-medium pl-4 flex ">
                          {i + 1} {field.value.name} 
                          {/* thisDone =  */}
                          <Check size={20} strokeWidth={1.5} />
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
            {/* <Button className="bg-[#182be2]" type="button"> */}
              Continue
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
export default Page;

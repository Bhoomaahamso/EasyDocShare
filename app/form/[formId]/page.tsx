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
  };

  const hgbt = async () => {
    const res = [
      {
        name: "s2.jpg",
        size: 9148,
        key: "06f77ccc-afcb-4552-8730-e2e5bb1b5e4f-2sf.jpg",
        serverData: {
          uploadedBy: "user_2fMKG7PSb4bXmN7J6cPi3t3XHV5",
        },
        url: "https://utfs.io/f/06f77ccc-afcb-4552-8730-e2e5bb1b5e4f-2sf.jpg",
        customId: null,
        type: "image/jpeg",
      },
    ];
    // have sub, files state and if not sub then delete all files;
    const data = await axios.patch("/api/form/" + idd, {
      form: hookform.getValues().fields[selected],
      files: res,
    });
  };


  if (!view) return;

  const df: Field[] = hookform.watch("fields");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("submit", values);
    setSubmitted(true);
    setFiles([]);

    const res = await axios.post("/api/mail", {
      id: values.id,
    });
    console.log("mailsend", res);
  }
  function onErr(values: any) {
    console.log("errr", values, hookform.formState.errors);
  }

  return (
    <Form {...hookform}>
      <form
        onSubmit={hookform.handleSubmit(onSubmit, onErr)}
        className="flex p-4"
      >
        <div className="">
          <main className="flex min-h-screen flex-col aitems-center ajustify-between pz-24 cursor-pointer">
            <Button
              type="button"
              onClick={() => {
              
                console.log("ssssssasda", hookform.getValues());
              }}
            >
              BBB
            </Button>
          
            <div className="">
              {/* {JSON.stringify(hookform.getValues().fields)} */}
              <h1>{selected+1 +'. '}{hookform.getValues().fields?.[selected].name}</h1>
              <h3>{hookform.getValues().fields?.[selected].description}</h3>
            </div>
            <UploadDropzone
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
            <div className="">
              {hookform
                .getValues()
                ?.fields?.[selected]?.attachments.map((file) => {
                  return (
                    <div className="">
                      <p>{file.name}</p>
                      <span>
                        <CircleX
                          color="#ff0000"
                          onClick={() => deleteAttachment(file.key)}
                        />
                      </span>
                    </div>
                  );
                })}
            </div>
          </main>
          {/* <Button type="submit">Aloha</Button> */}
        </div>
        <div className="">
          <div className="">
            <h1>Cheklist</h1>
            {hookform.getValues()?.fields &&
              JSON.stringify(
                hookform.getValues().fields.map((i) => i.attachments)
              )}
            <h3>{/* ({requireds} Required Item{requireds > 1 && "s"}) */}</h3>
            {df?.map((val, i) => (
              <div
                className={`flex justify-between ${
                  i == selected && "bg-red-400"
                }`}
                onClick={() => {
                  setSelected(i);
                  // console.log("SET ATT");
                  // hookform.setValue(`fields.${i}.attachments`, [
                  //   ...hookform.getValues().fields[i].attachments,
                  //   "hiiiiii",
                  // ]);
                  // console.log('qazaq', hookform.getValues().fields[0])
                }}
                // {...hookform.register(`fields.${i}.attachments`, {
                //   validate: (value) => {
                //     if (hookform.getValues().fields[i].required === true) {
                //       console.log("valid", value);
                //       return value.length > 0
                //         ? true
                //         : "The item cannot be empty";
                //     } else return true;
                //   },
                // })}
              >
                <FormField
                  control={hookform.control}
                  name={`fields.${i}`}
                  render={({ field }) => (
                    <FormItem className=" mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="">
                          {i + 1} {field.value.name}
                          {/* {JSON.stringify(field.value)} */}
                        </FormLabel>
                        {!field.value.required && <p className="">Optional</p>}
                        {field.value.comment &&
                        //  <p><MessageCircleWarning color="#f70202" /></p>
                        <Dialog>
                        <DialogTrigger><MessageCircleWarning size={36} color="#f70202" className="hover:bg-red-200 rounded-full cursor-pointer p-1 " /></DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{field.value.comment}</DialogTitle>
                            {/* <DialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove your data from our servers.
                            </DialogDescription> */}
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                        }
                        
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
          <div className="">
            <Button variant="outline" type="submit">
              Continue
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
export default page;

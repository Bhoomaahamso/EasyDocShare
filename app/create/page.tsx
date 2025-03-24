"use client";

// import FormElement from "@/components/elements/FormElement";
import { useState, useEffect, useId, useRef } from "react";
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
import { CircleX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Test from "@/components/elements/Test";

/*
// {
//   "title": "fcfcfc",
//   "rname": "fff",
//   "email": "hjhgjg@gmail.com",
//   "message": "",
//   "dynamicFields": [
//       {
//           "name": "fcfc",
//           "type": "sign",
//           "file": {},
//                                 annotations
//           "description": "",
//           "required": true
//       }
//   ],
//   "userId": "user_2fMKG7PSb4bXmN7J6cPi3t3XHV5",
//   "userName": "Pika Singh"
// }

const newAnnotation = {
      annotationType: "text",
      left: "50px",
      top: "150px",
      width: 100,
      height: 20,
      value: "",
      imageType: "",
      page: currentPage,
      role,
    };




    


data-body {
  title: 'fghg',
  rname: 'sdf',
  email: 'hjhgjg@gmail.com',
  message: '',
  dynamicFields: [
    {
      name: 'Item One',
      type: 'sign',
      file: {},
      description: '',
      required: true
    }
  ],
  annotations: [
    {
      annotationType: 'text',
      left: '210px',
      top: '343px',
      width: 100,
      height: 20,
      value: 'rrrrrrr',
      imageType: '',
      page: 1,
      role: 'creator'
    },
    {
      annotationType: 'text',
      left: '50px',
      top: '150px',
      width: 100,
      height: 20,
      value: '',
      imageType: '',
      page: 1,
      role: 'user'
    }
  ],
  userId: 'user_2fMKG7PSb4bXmN7J6cPi3t3XHV5',
  userName: 'Pika Singh',
  sender: 'pikasingh2019@gmail.com'
}












*/
// need annotations array
// let fileType = new File(['blob'], 'name')

const dynamicFieldsSchema = z
  .object({
    name: z.string().min(3, "Item Name must contain at least 3 characters"),
    type: z.string(),
    annotations: z.array(z.object({
      annotationType: z.string(),
      left: z.string(),
      top: z.string(),
      width: z.number(),
      height: z.number(),
      value: z.string(),
      imageType: z.string(),
      page: z.number(),
      role: z.string(),
    })).optional(),

    file:  z.instanceof(globalThis.File).optional(),
   
    description: z.string(),
    required: z.boolean(),
  })
  .array()
  .min(1, "Please add at least one item to the form.")
  .refine((fields) => fields.some((field) => field.required), {
    message: "At least one field must be marked as required.",
  })
  .superRefine((data, ctx) => {
    console.log('dataaaaaaaaaaaaaaa', data)
   const {type, file} = data;
   //what is this shit????
  //  if (type === 'sign' && !( file instanceof File)) {
  //   ctx.addIssue( {
  //     code: z.ZodIssueCode.too_small,
  //     minimum: min,
  //     type: 'number',
  //     inclusive: true,
  //     message: `Height must be greater than ${ min }`,
  // } )
  // }/
  })
  /// try this approach
  // .superRefine((data, ctx) => {
  //   data.forEach((item, index) => {
  //     if (item.type === 'sign' && !(item.file instanceof File)) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: `File is required for signature items`,
  //         path: [index, 'file']
  //       });
  //     }
  //   });
  // })

const formSchema = z.object({
  title: z.string().min(3, "Title must contain at least 3 characters"),
  rname: z.string().min(2, "Name must contain at least 3 characters"),
  email: z.string().email(),
  // type: z.string(),
  message: z.string(),
  dynamicFields: dynamicFieldsSchema,
});

function Page() {
  const [view, setView] = useState(false);
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [dateCollector, setDateCollector] = useState([]);  
  const user = useUser();

  const hookform = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      rname: "",
      email: "",
      message: "",
      dynamicFields: [
        {
          name: "",
          description: "",
          required: true,
          file: undefined,
          type: "sign",
        },
      ],
    },
    mode: "onBlur",
    reValidateMode: "onBlur"
  });

  const { fields, append, remove, update } = useFieldArray({
    control: hookform.control,
    name: "dynamicFields",
  });

  let df: z.infer<typeof dynamicFieldsSchema> = hookform.watch("dynamicFields");

  // console.log("sss", df);
  const requireds = df.filter((v) => v.required).length;

  useEffect(() => {
    setView(true);
  }, []);
  if (!view) return;
  if (!user.user) return;

  const handleAppend = () => {
    append({
      name: "",
      description: "",
      required: true,
      file: undefined,
      type: "files",
      annotations: [],
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("SUBMIT", values);
      /*
      {
  title: 'test',
  rname: 'ggggg',
  email: 'john4@gmail.com',
  message: 'Custom Message',
  dynamicFields: [{
      name: 'Item One',
      type: 'sign',
      annotations: [{
          annotationType: 'text',
          left: '370px',
          top: '428px',
          width: 100,
          height: 20,
          value: 'fff',
          imageType: '',
          page: 1,
          role: 'creator'
        },
        {
          annotationType: 'text',
          left: '50px',
          top: '150px',
          width: 100,
          height: 20,
          value: '',
          imageType: '',
          page: 1,
          role: 'user'
        }
      ],
      file: File {
        name: '49 26.pdf',
        lastModified: 1737321566195,
        lastModifiedDate: new Date('2025-01-19T21:19:26.000Z'),
        webkitRelativePath: '',
        size: 49016,
        type: 'application/pdf'
      },
      description: 'fff',
      required: true
    }
  ]
}
      */
      const formData = new FormData();
//debugger;
values.dynamicFields.forEach((value, index) => { 
  formData.append(`dynamicFields[${index}]`, value.file);
})

formData.append("userInfo", JSON.stringify(  {
    ...values,
    // annotations: annotations,
    userId: user?.user?.id,
    userName: user.user?.fullName || user.user?.firstName,
    sender: user?.user?.primaryEmailAddress?.emailAddress,
  }));

console.log('formData', formData);
// return;
      const res = await axios.post("/api/form",
        formData
      //   {
      //   ...values,
      //   // annotations: annotations,
      //   userId: user?.user?.id,
      //   userName: user.user?.fullName || user.user?.firstName,
      //   sender: user?.user?.primaryEmailAddress?.emailAddress,
      // }
    );
      // console.log("resed", {
      //   ...values,
      //   userId: user.user?.id,
      //   userName: user.user?.fullName || user.user?.firstName,
      // });

      console.log("resed", res);
      toast.success("Form sent successfully");
    } catch (error) {
      console.log("ERROR", error);
      toast.error("Something went wrong");
    }
  }
  function onErr(obj: any) {
    const messages: string[] = [];

    function traverse(obj: { [key: string]: any }) {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          traverse(obj[key]);
        } else if (key === "message") {
          messages.push(`${obj[key]}`);
        }
      }
    }

    traverse(obj);
    messages.forEach((i) => toast.error(i, { duration: 5000 }));
    console.log("ONerrr", messages, obj);
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
    } else {
      setPdfLoading(true);
    }

  };

  const handleSave = (index: number, bytes: File) => {
    // update(index, { ...df[index], file: bytes });
    hookform.setValue(`dynamicFields.${index}.file`, bytes);
    hookform.setValue(`dynamicFields.${index}.annotations`, annotations);
    setAnnotations([]);
    console.log("onSave", df[index].file, bytes);
  };

  console.log("RENDER");
  return (
    <>
      <Form {...hookform}>
        <form
          onSubmit={hookform.handleSubmit(onSubmit, onErr)}
          className="flex justify-center p-4 h-[95vh] bg-[#f8f8f8]"
        >
          {/* col 1 */}
          {/* <div className="flex flex-col p-4 gap-y-8"> */}
          <div className="grid grid-cols-[2fr_1fr] gap-x-16 gap-y-8">
            {/* create form */}
            <div className="bg-white max-w-[600px] md:w-[600px] p-8 ">
              <h1 className="text-xl font-medium">Create New Request</h1>

              <FormField
                control={hookform.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="my-4">
                    <FormLabel className="text-[#888888]">
                      Request Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="!mt-0 text-[#888888]"
                        placeholder="Title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h2 className=" font-mediummb-2">Add Items to Checklist</h2>

              <div className="h-fit max-h-[350px] overflow-y-auto scrollbar-width-thin -webkit-scrollbar-none relative">
                {fields.map((ff, index) => (
                  <>
                    <div
                      key={ff.id}
                      className="space-y-3 mt-6 py-4 border-t-2 border-t-black"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Button
                            onClick={() => {
                              console.log("CLG", df);
                            }}
                          >
                            Joe
                          </Button>
                          {index + 1}. {df[index]?.name || "(Item Name)"}
                        </div>
                        <button type="button" onClick={() => remove(index)}>
                          <CircleX color="#b61a1a" />
                        </button>
                      </div>

                      <FormField
                        control={hookform.control}
                        name={`dynamicFields.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              {...field}
                              onValueChange={field.onChange}
                              defaultValue="sign"
                            >
                              <FormControl className="text-blue-500">
                                <SelectTrigger>
                                  <SelectValue placeholder="Standard File(s)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="files">
                                  Standard File(s)
                                </SelectItem>
                                <SelectItem value="sign">
                                  E-Signature/Forms
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={hookform.control}
                        name={`dynamicFields.${index}.name`}
                        render={({ field }) => (
                          <FormItem className=" mb-2">
                            <FormLabel className="text-[#888888]">
                              Item Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="!mt-0 text-[#888888]"
                                placeholder="Item Name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={hookform.control}
                        name={`dynamicFields.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#888888]">
                              Item Description/Instructions (Optional){" "}
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="!mt-0 text-[#888888]"
                                placeholder="Item Description/Instructions (Optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={hookform.control}
                        name={`dynamicFields.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2 space-y-0  py-4 ">
                            <FormControl>
                              <Checkbox
                                className="data-[state=checked]:bg-[#182be2] data-[state=checked]:text-slate-50 rounded"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none cursor-pointer">
                              <FormLabel className="text-[#888888] cursor-pointer">
                                Required
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      {df[index].type === "sign" && (
                        <FormField
                          control={hookform.control}
                          name={`dynamicFields.${index}.file`}
                          render={({ field }) => (
                            <FormItem className=" mb-2">
                              <FormLabel className="text-[#888888] flex">
                                Upload Document (required):
                                {JSON.stringify(field.value)}
                                {/* {console.log("file", field)} */}
                              </FormLabel>
                              <FormControl>
                                <>
                                  {/* <Button> */}
                                  <Button
                                    type="button"
                                    // {...field}
                                    // onClick={async (e) => {
                                    //   await e.target?.childNodes[1]?.click();
                                    //   // console.log(
                                    //   //   "ref",
                                    //   //   e.target?.childNodes[1]?.click()
                                    //   // );
                                    // }}
                                  >
                                    <label
                                      // htmlFor={index}
                                      className="cursor-pointer"
                                    >
                                      Upload
                                      <Input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        // id={index}
                                        // {...field}
                                        onChange={(e) => {
                                          let f = e.target?.files?.[0];
                                          console.log("will it work", f);
                                          if(f?.type !== 'application/pdf'){
                                            toast.error('Only PDF files are allowed')
                                            return;
                                          }
                                          update(index, {
                                            ...df[index],
                                            file: f,
                                          });
                                          const reader = new FileReader();
                                          reader.onload = function (e) {
                                            const arrayBuffer =
                                              e.target?.result;
                                            // field.value = arrayBuffer;
                                            // update(index,{...df[index], file: arrayBuffer})
                                            // field.onChange(arrayBuffer)
                                            // Now arrayBuffer contains the PDF file as an ArrayBuffer
                                            // console.log("ar", arrayBuffer,field.value);
                                            // You can store it or manipulate it as needed
                                          };
                                          reader.onerror = function (e) {
                                            console.error(
                                              "Error reading file",
                                              e
                                            );
                                          };
                                          if (f) reader.readAsArrayBuffer(f);
                                        }}
                                        className="!mt-0 hidden text-[#888888]"
                                      />
                                    </label>
                                  </Button>
                                  {/* {field.value && ( */}
                                  {df[index].file && (
                                    <Dialog onOpenChange={handleOpenChange}>
                                      <DialogTrigger>
                                        <Button type="button"> Edit </Button>
                                      </DialogTrigger>
                                      <DialogContent className="w-[90vw] max-w-[100vw]">
                                        {/* <DialogHeader>
                                    <DialogTitle>
                                      Are you absolutely sure?
                                    </DialogTitle>
                                    <DialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete your account and remove
                                      your data from our servers.
                                    </DialogDescription>
                                  </DialogHeader> */}
<p>mmm</p>
                                       <Test
                                          url={field.value}
                                          annotations={annotations}
                                          setAnnotations={setAnnotations}
                                          setDateCollector={setDateCollector}
                                          pdfLoading={pdfLoading}
                                          setPdfLoading={setPdfLoading}
                                          pdfIndex={index}
                                          onSave={handleSave}
                                          mode="create"
                                        />
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </>
                ))}
              </div>
            </div>

            {/* </div> */}
            {/* col 2 */}
            {/* <div className="flex flex-col items-center gap-y-8"> */}
            {/* list */}
            <div className="space-y-4 min-h-full w-60 p-4 bg-white">
              <h1 className="text-xl font-medium">Checklist</h1>
              <h3 className="text-xl font-medium">
                ({requireds} Required Item{requireds > 1 && "s"})
              </h3>
              {df.map((val, i) => (
                <div key={i} className="flex justify-between">
                  <h5>
                    {i + 1}. {val?.name}
                  </h5>
                  {!val.required && (
                    <p className="text-[#5c77d1] bg-[#dfecfc] font-semibold rounded-full px-2">
                      Optional
                    </p>
                  )}
                </div>
              ))}
            </div>
            {/* button */}
            <Button
              className="bg-[#1c2dd6] w-fit ml-8"
              type="button"
              onClick={handleAppend}
            >
              Add Item +
            </Button>
            {/* btn */}
            <div className="text-center">
              {/* <Dialog open={open} onOpenChange={setOpen}> */}
              <Dialog open={open} onOpenChange={setOpen}>
                {/* <DialogTrigger > */}
                  <Button variant="outline" type="button" onClick={async()=>{
                    console.log('hk',hookform);
                   // debugger;
                    const res = await hookform?.trigger(["title"]);
                    console.log('res:', res)
                    if(res){ setOpen(true)}}}>Continue</Button>
                {/* </DialogTrigger> */}
                <DialogContent className="sm:maxi-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <FormField
                      control={hookform.control}
                      name="rname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Recipient's Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={hookform.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Recipient's Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={hookform.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Email Message</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Custom Message (Optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center">
                      <Label>Authentication Method: </Label>
                      <p className="text-sm ml-2">Email Code</p>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-row justify-between">
                    <Button
                      className="bg-[#1c2dd6]"
                      onClick={hookform.handleSubmit(onSubmit, onErr)}
                    >
                      Send
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
export default Page;

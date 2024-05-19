"use client";

import FormElement from "@/components/elements/FormElement";
import { useState, useId, useEffect } from "react";
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
import { CircleX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(3),
  rname: z.string().min(2),
  email: z.string().email(),
  message: z.string(),
  dynamicFields: z
    .object({
      name: z.string().min(3),
      description: z.string(),
      required: z.boolean(),
    })
    .array()
    .min(1, "Please add at least one item to the form.")
    .refine((fields) => fields.some(field => field.required), {
      message: "At least one field must be marked as required.",
    })
});

function page() {
  const [view, setView] = useState(false);

  const user = useUser()
  console.log("user",user);

  
  const hookform = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      rname: "",
      email: "",
      message: "",
      dynamicFields: [{ name: "", description: "", required: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: hookform.control,
    name: "dynamicFields",
  });
  
  useEffect(() => {
    setView(true);
  }, []);
  if (!view) return;
  if(!user.user) return;

  const df: {
    name: string;
    description: string;
    required: boolean;
  }[] = hookform.watch("dynamicFields");
  // console.log("qq", df);
  const requireds = df.filter((v) => v.required).length;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const res = await axios.post('/api/form', {
      ...values,
      userId: user?.user?.id,
      userName: user.user?.fullName || user.user?.firstName,
      sender: user?.user?.primaryEmailAddress?.emailAddress
    })
    console.log("resed", {
      ...values,
      userId: user.user.id,
      userName: user.user?.fullName || user.user?.firstName
    });
    // console.log('resed', res)
  }
  function onErr(obj: any) {
    const messages = [];

    // Helper function to traverse through the object recursively
    function traverse(obj) {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          traverse(obj[key]);
        } else if (key === "message") {
          // messages.push(`${key}: ${obj[key]}`);
          messages.push(`${obj[key]}`);
        }
      }
    }

    traverse(obj);
    messages.forEach((i) => toast.error(i, { duration: 5000 }));
    // return messages;
    console.log("errr", messages, obj);
  }

  return (
    <Form {...hookform}>
      <form
        onSubmit={hookform.handleSubmit(onSubmit, onErr)}
        className="flex p-4"
      >
        <div className="">
          <div className="bg-pink-200 max-w-[600px] md:w-[600px]">
            <h1>Create New Request</h1>

            <FormField
              control={hookform.control}
              name="title"
              render={({ field }) => (
                <FormItem className=" mb-2">
                  <FormLabel>Request Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h2 className="font-bold mb-4">Add Items to Checklist</h2>

            <div className="h-[350px] overflow-y-auto scrollbar-width-thin -webkit-scrollbar-none relative">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 my-6 py-2 border-t-2 border-t-black"
                >
                  <FormField
                    control={hookform.control}
                    name={`dynamicFields.${index}.name`}
                    render={({ field }) => (
                      <FormItem className=" mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel className="">
                            {index + 1} {field.value || "(Item Name)"}
                          </FormLabel>
                          <button type="button" onClick={() => remove(index)}>
                            <CircleX color="#ff0000" />
                          </button>
                        </div>
                        {/* select */}
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Item Name" {...field} />
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
                        <FormLabel>
                          Item Description/Instructions (Optional){" "}
                        </FormLabel>
                        <FormControl>
                          <Input
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
                      <FormItem className="flex items-start space-x-3 space-y-0  p-4 ">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none cursor-pointer">
                          <FormLabel className="cursor-pointer">
                            Required
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
          <Button
            className="bg-blue-800"
            onClick={() =>
              append({ name: "", description: "", required: true })
            }
          >
            Add Item +
          </Button>
          <Button
            type="button"
            onClick={() => {
              console.log("qweee", hookform.formState.errors);
            }}
          >
            Aloha
          </Button>
        </div>
        <div className="">
          <div className="">
            <h1>Cheklist</h1>
            <h3>
              ({requireds} Required Item{requireds > 1 && "s"})
            </h3>
            {df.map((val, i) => (
              <div className="flex justify-between">
                <h5>
                  {i + 1}. {val.name}
                </h5>
                {!val.required && <p className="">Optional</p>}
              </div>
            ))}
          </div>
          <div className="">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Continue</Button>
              </DialogTrigger>
              <DialogContent className="sm:maxi-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  {/* <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription> */}
                </DialogHeader>
                {/* from, to, msg, auth */}
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
                  {/* <Button type="button">Close</Button> */}
                  <Button
                    onClick={hookform.handleSubmit(onSubmit, onErr)}
                    type="submit"
                  >
                    <DialogClose asChild>
                      <>Send</>
                    </DialogClose>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </form>
    </Form>
  );
}
export default page;

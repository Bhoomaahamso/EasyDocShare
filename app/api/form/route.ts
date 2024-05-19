import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import templates from "./email";
import { sendMail } from "@/email/sendMail";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const data = await req.json();
    console.log("data", data);

    if (
      !data.userId ||
      !data.userName ||
      !data.title ||
      !data.email ||
      !data.sender ||
      !data.rname ||
      data.dynamicFields.length < 1
    ) {
      console.log("not found");
      return NextResponse.json({ error: "Incomplete Data" }, { status: 400 });
    }

    const code = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    const form = await db.document.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        title: data.title,
        from: data.sender,
        to: data.email,
        recipientName: data.rname,
        message: data?.message,
        code: code,
        fields: {
          createMany: {
            data: data.dynamicFields,
          },
        },
      },
      include: {
        fields: true,
      },
    });
    console.log("form", form);

    sendMail({
      from: `system@demomailtrap.com`,
      to: data.email,
      subject: data.title,
      category: "formCreated",
      data: {
        title: data.title,
        rname: data.rname,
        email: data.email,
        userName: data.userName,
        customMessage: data?.message,
        formPage: `http://localhost:3000/form?f=${form.id}`,
        code: code,
      },
    });

    return NextResponse.json({ res });
  } catch (error) {
    console.log("FORM_POST", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

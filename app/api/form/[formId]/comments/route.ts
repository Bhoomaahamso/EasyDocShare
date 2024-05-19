import { sendMail } from "@/email/sendMail";
import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { formId: string; fieldId: string } },
  res: NextResponse
) {
  try {
    const data = await req.json();
    const form = await db.document.findFirst({
      where: {
        id: params.formId,
      },
      include: {
        fields: {
          include: {
            attachments: true,
          },
        },
      },
    });
    console.log("form", data, params.formId, params.fieldId, form);
    if (!form) {
      return;
    }

    data.forEach(async (element) => {
      const val = await db.field.update({
        where: {
          id: element.id,
        },
        data: {
          comment: element.comment,
        },
      });
      console.log('db call', val)
    });

    sendMail({
        from: `system@demomailtrap.com`,
        to: form.to,
        subject: form.title,
        category: 'formChanges',
        data: {
          title: form.title,
          name: form.recipientName,
          rname: form.userName,
          email: form.from,
          formPage: `http://localhost:3000/form?f=${form.id}`,
          code: form.code
        },
      });

    return NextResponse.json({ m: data.comment });
  } catch (error) {
    console.log("COMMENT_PATCH", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

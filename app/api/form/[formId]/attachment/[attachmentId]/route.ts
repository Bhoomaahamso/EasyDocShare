import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { formId: string; attachmentId: string } },
  res: NextResponse
) {
  try {
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
    console.log("form", params.formId, params.attachmentId, form);
    if (!form) {
      return;
    }

    const file = form?.fields.flatMap((field) =>
      field.attachments.filter(
        (attachment) => attachment.key === params.attachmentId
      )
    );
    console.log("qaz", file);

    if (file.length === 0) {
      return;
    }

    const del = await db.attachment.deleteMany({
      where: {
        key: params.attachmentId,
      },
    });
    console.log("del", del);
    return NextResponse.json(del);
  } catch (error) {
    console.log("ATTACHMENT_ID_DELETE", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

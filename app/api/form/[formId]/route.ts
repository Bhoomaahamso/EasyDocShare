import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } },
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

    return NextResponse.json({ ...form });
  } catch (error) {
    console.log("FORM_ID_GET", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, res: NextResponse) {
  try {
    const data = await req.json();
    console.log("attach", data);

    const files = data.files.map((item) => ({
      name: item.name,
      size: item.size,
      key: item.key,
      url: item.url,
      type: item.type,
      fieldId: data.form.id,
    }));

    const a = await db.attachment.createMany({
      data: files,
    });

    console.log("makes attachments", a);

    return NextResponse.json({ req });
  } catch (error) {
    console.log("FORM_ID_POST", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

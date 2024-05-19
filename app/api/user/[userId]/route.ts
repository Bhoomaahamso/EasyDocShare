import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
  res: NextResponse
) {
  try {
    if (!params.userId) {
      console.log("not found");
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const form = await db.document.findMany({
      where: {
        userId: params.userId,
      },
      include: {
        fields: {
          include: {
            attachments: true,
          },
        },
      },
    });
    console.log("form", form);

    return NextResponse.json({ form });
  } catch (error) {
    console.log("USER_GET", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

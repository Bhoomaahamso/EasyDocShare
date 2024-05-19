import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const param = req.nextUrl.searchParams.get("f");
    const data = await req.json();
    console.log("data", data, param);

    if (!param || !data.code) {
      console.log("not found");
      return NextResponse.json({ error: "Incomplete Data" }, { status: 400 });
    }

    const form = await db.document.findFirst({
        where:{
            id: param,
            code: parseInt(data.code)
        }
    })
    console.log('????',form)

    if(form === null) {
        console.log("wrong code");
      return NextResponse.json({ error: "Wrong Code" }, { status: 401 });
    }




    return NextResponse.json({ form })
  } catch (error) {
    console.log("AUTH_POST", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

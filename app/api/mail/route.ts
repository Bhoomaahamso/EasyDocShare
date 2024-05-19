import { sendMail } from "@/email/sendMail";
import db from "@/lib/utils";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";


//  FOR TESTING MAIL
// export async function GET(request: Request) {
//   const mailData = {
//     from: "cat@demomailtrap.com",
//     to: "@gmail.com",
//     subject: `New Subject form?`,
//     text: `Pigeon???`,
//     html: `<h1>Cat Man</h1>`,
//     // html: data,
//     category: 'customer'
//   };

//   const transport = nodemailer.createTransport({
//     host: "live.smtp.mailtrap.io",
//     port: 587,
//     auth: {
//         user: process.env.MAILTRAP_USER,
//         pass: process.env.MAILTRAP_PASS,
//     },
//   });

//   transport.sendMail(mailData, (error, info) => {
//     if (error) {
//       console.log(error);
//     return;
//     }
//     console.log(`Message sent: ${info}`);
//   });

//     res.status(200).json({ body });

//   return Response.json({ msg: "ok" });
// }

export async function POST(req: Request) {
  const data = await req.json();
  console.log("data", data);

  if (!data.id) {
    console.log("not found");
    return NextResponse.json({ error: "Incomplete Data" }, { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: {
      id: data.id,
    },
  });
  if (!doc) {
    console.log("not found");
    return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
  }
  console.log("doc, doc", doc);
  
  sendMail({
    from: `system@demomailtrap.com`,
    // to: '@gmail.com', // NEEDS TO BE CHANGED 
    to: doc.from,
    subject: `${doc.title} submitted`,
    category: 'formSubmitted',
    data: {
      title: doc.title,
      rname: doc.recipientName,
      email: doc.to,
      userName: doc.userName,
      requestPage: `http://localhost:3000/request/${doc.id}`,
    },
  })

  return NextResponse.json({ msg: "Document Sent" }, { status: 200 });
}

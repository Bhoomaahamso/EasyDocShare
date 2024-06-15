import { sendMail } from "@/email/sendMail";
import db from "@/lib/utils";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { PDFDocument, rgb } from 'pdf-lib';
import {  PDFHexString, PDFName } from 'pdf-lib';

import fs from 'fs';

export async function GET(request: Request, response: Response){
  
  async function createPdfWithButton() {
    // Create a new PDFDocument
  //   const pdfDoc = await PDFDocument.create();
  
  //   // Add a page to the document
  //   const page = pdfDoc.addPage([600, 400]);
  
  //   // Define button properties
  //   const button = {
  //     x: 50,
  //     y: 300,
  //     width: 100,
  //     height: 50,
  //     text: 'Click Me',
  //     textSize: 12,
  //     textColor: rgb(1, 1, 1),
  //     backgroundColor: rgb(0, 0.5, 0.5),
  //   };
  
  //   // Draw the button background
  //   page.drawRectangle({
  //     x: button.x,
  //     y: button.y,
  //     width: button.width,
  //     height: button.height,
  //     color: button.backgroundColor,
  //   });
  
  //   // Add the button text
  //   page.drawText(button.text, {
  //     x: button.x + 10,
  //     y: button.y + 20,
  //     size: button.textSize,
  //     color: button.textColor,
  //   });
  
  //   // Add the button widget annotation to the page
  //   const buttonField = pdfDoc.getForm().createButton('btn1');
  //   console.log('first button field', buttonField)
  // // return Response.json({ buttonField });
  // // return buttonField

  //   // buttonField.setText(button.text);
  //   buttonField.addToPage('help',page, {
  //     x: button.x,
  //     y: button.y,
  //     width: button.width,
  //     height: button.height,
  //   });
  
  //   // Optionally, add actions to the button (e.g., print the document when clicked)
  //   // buttonField.addAction('MouseUp', 'this.print({bUI:true,bSilent:false,bShrinkToFit:true});');
  
  //   // Serialize the PDFDocument to bytes (a Uint8Array)
  //   const pdfBytes = await pdfDoc.save();






    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage();
  
    const form = pdfDoc.getForm();
  
    const button = form.createButton('foo.bar');
    button.addToPage('Hello World!', page, {
      width: 100,
      height: 50,
      x: page.getWidth() / 2 - 100 / 2,
      y: page.getHeight() / 2 - 50 / 2,
    });
  
    const helloWorldScript = 'console.show(); console.println("Hello World!"); console.log(helloWorldScript);';
    button.acroField.getWidgets().forEach((widget) => {
      widget.dict.set(
        PDFName.of('AA'),
        pdfDoc.context.obj({
          U: {
            Type: 'Action',
            S: 'JavaScript',
            JS: PDFHexString.fromText(helloWorldScript),
          },
        }),
      );
    });
  
    const pdfBytes = await pdfDoc.save();

  
    // Write the PDF to a file
    fs.writeFileSync('pdf-with-button.pdf', pdfBytes);
  }
  
  // createPdfWithButton().then(() => {
  //   console.log('PDF created successfully!');
  // }).catch((err) => {
  //   console.error('Error creating PDF:', err);
  // });
  
  const d = await createPdfWithButton();
  console.log('d',d)

  return Response.json({ msg: "2" });
}


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

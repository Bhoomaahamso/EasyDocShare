import db from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
// import templates from "./email";
import { sendMail } from "@/email/sendMail";
import { utapi } from "@/utils/uploadthing";

// data-body {
//   title: 'vbnnbv',
//   rname: 'sdf',
//   email: 'john4@gmail.com',
//   message: '',
//   dynamicFields: [
//     {
//       name: 'Item One',
//       type: 'sign',
//       annotations: [Array],
//       file: {},
//       description: 'ghjgjh',
//       required: true
//     }
//   ],
//   userId: 'user_2fMKG7PSb4bXmN7J6cPi3t3XHV5',
//   userName: 'Pika Singh',
//   sender: 'pikasingh2019@gmail.com'
// }

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const formData = await req.formData();

    console.log("data-body", formData);
    
    const code = Math.floor(Math.random() * 900000) + 100000;
    
    // Extract files and other data from FormData
    const files = {};
    let otherData = JSON.parse(formData.get("userInfo"));
    formData.delete("userInfo");
    
    // Separate files and non-file data
    for (const [key, value] of formData.entries()) {
      // if (key !== 'userInfo') {
        // if (key.startsWith("dynamicFields[")) {
        if(value !== 'undefined') files[key] = value; // Files are categorized by their dynamic keys
        // }
      // } else {
      //   otherData = value; // Other data (like userId, title, etc.)
      // }
    }
    
    console.log('file uploaded', files, otherData);
    
    const uploadedFiles = await utapi.uploadFiles(Object.values(files));
    
    console.log('first file uploaded', uploadedFiles);
    
    // Map uploaded files to their dynamic field indices
    const fileMap = {};
    Object.keys(files).forEach((key, index) => {
      const match = key.match(/\[(\d+)]$/); // Extract index from "dynamicFields[0]"
      if (match) {
        const fieldIndex = parseInt(match[1], 10);
        fileMap[fieldIndex] = {
          docName: uploadedFiles[index]?.data?.name,
          docKey: uploadedFiles[index]?.data?.key,
          docUrl: uploadedFiles[index]?.data?.url,
        };
      }
    });
    
    // const dynamicFields = JSON.parse(otherData.dynamicFields || "[]"); // Ensure it's parsed JSON
    const dynamicFields = otherData.dynamicFields; // Ensure it's parsed JSON
    
    // Prepare data for database insertion
    const fieldsData = dynamicFields.map((field, index) => ({
      name: field.name,
      type: field.type,
      description: field.description,
      required: field.required,
      ...(fileMap[index] || {}), // Include file details if available
      attachments: {
        createMany: {
          data: (field.annotations || []).map(annotation => ({
            annotationType: annotation.annotationType,
            left: annotation.left,
            top: annotation.top,
            width: annotation.width,
            height: annotation.height,
            value: annotation.value,
            imageType: annotation.imageType,
            page: annotation.page,
            role: annotation.role,
          })),
        },
      },
    }));
    console.log('final data',fieldsData, JSON.stringify({
      userId: otherData.userId,
      userName: otherData.userName,
      title: otherData.title,
      from: otherData.sender,
      to: otherData.email,
      recipientName: otherData.rname,
      message: otherData?.message,
      code: code,
      fields: {
        create: fieldsData,
      },
    }))
    
    const form = await db.document.create({
      data: {
        userId: otherData.userId,
        userName: otherData.userName,
        title: otherData.title,
        from: otherData.sender,
        to: otherData.email,
        recipientName: otherData.rname,
        message: otherData?.message,
        code: code,
        fields: {
          create: fieldsData,
        },
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
    sendMail({
            from: `system@demomailtrap.com`,
            to: otherData.email,
            subject: otherData.title,
            category: "formCreated",
            data: {
              title: otherData.title,
              rname: otherData.rname,
              email: otherData.email,
              userName: otherData.userName,
              customMessage: otherData?.message,
              formPage: `http://localhost:3000/form?f=${form.id}`,
              code: code,
            },
          });

    return NextResponse.json({ msg: 'ran' });
  } catch (error) {
    console.log("FORM_POST", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// export async function POST(req: NextRequest, res: NextResponse) {
//   try {
//     const formData = await req.formData();
//     // console.log("data-body", JSON.stringify(data));
//     console.log("data-body", formData);

//     // if (
//     //   !data.userId ||
//     //   !data.userName ||
//     //   !data.title ||
//     //   !data.email ||
//     //   !data.sender ||
//     //   !data.rname ||
//     //   data.dynamicFields.length < 1
//     // ) {
//     //   console.log("not found");
//     //   return NextResponse.json({ error: "Incomplete Data" }, { status: 400 });
//     // }

//     const code = Math.floor(Math.random() * 900000) + 100000;
//     // send pdf to upload thing and formdata -- upload thing docs and chatgpt convo
//     // make prisma req -- notepad

//     const files ={}// data.get()
//     // map((field) => {
//     //   console.log('first', field);
//     //   // field?.file
//     // });

//   // Iterate over FormData entries
//   for (const [key, value] of Array.from(formData.entries())) {
//     if(key !== 'demo'){

//       files[key] = value;
//     }
//   }
//     console.log(' file uploaded', files);
//     const file = await utapi.uploadFiles(Object.values(files));
//     const data = formData.get('demo');
//     console.log('first file uploaded', file);
//     // const dataVal = {
      
//     // }
//     // file uploaded {
//     //   'dynamicFields[0]': File {
//     //     size: 48627,
//     //     type: 'application/pdf',
//     //     name: '6 19.pdf',
//     //     lastModified: 1737408994716
//     //   }
//     // }
//     // first file uploaded [
//     //   {
//     //     data: {
//     //       key: '4a0f1422-1a52-487d-8c91-316c5f802f65-z68i.pdf',
//     //       url: 'https://utfs.io/f/4a0f1422-1a52-487d-8c91-316c5f802f65-z68i.pdf',
//     //       name: '6 19.pdf',
//     //       size: 48627,
//     //       type: 'application/pdf',
//     //       customId: null
//     //     },
//     //     error: null
//     //   }
//     // ]
//     const form = await db.document.create({
//       data: {
//         userId: data.userId,
//         userName: data.userName,
//         title: data.title,
//         from: data.sender,
//         to: data.email,
//         recipientName: data.rname,
//         message: data?.message,
//         code: code,
//         fields: {
//           create: data.dynamicFields.map((field, index) => ({
//             name: field.name,
//             type: field.type,
//             description: field.description,
//             required: field.required,
//             ...(field.file ? {
//               docName: file[files.indexOf(`dynamicFields[${index}]`)].docName, 
//   docKey: file[].docKey,
//   docUrl: file[].docUrl,
//             }:
//           {}),
//             attachments: {
//               createMany: {
//                 data: field.annotations.map(annotation => ({
//                   annotationType: annotation.annotationType,
//                   left: annotation.left,
//                   top: annotation.top,
//                   width: annotation.width,
//                   height: annotation.height,
//                   value: annotation.value,
//                   imageType: annotation.imageType,
//                   page: annotation.page,
//                   role: annotation.role
//                 }))
//               }
//             }
//           }))
//         },
//       },
//       include: {
//         fields: {
//           include: {
//             attachments: true
//           }
//         },
//       },
//     });
    
//     console.log("form", form);



//     // const form = await db.document.create({
//     //   data: {
//     //     userId: data.userId,
//     //     userName: data.userName,
//     //     title: data.title,
//     //     from: data.sender,
//     //     to: data.email,
//     //     recipientName: data.rname,
//     //     message: data?.message,
//     //     code: code,
//     //     fields: {
//     //       createMany: {
//     //         data: data.dynamicFields,
//     //       },
//     //     },
//     //   },
//     //   include: {
//     //     fields: true,
//     //   },
//     // });
//     // console.log("form", form);

//     // sendMail({
//     //   from: `system@demomailtrap.com`,
//     //   to: data.email,
//     //   subject: data.title,
//     //   category: "formCreated",
//     //   data: {
//     //     title: data.title,
//     //     rname: data.rname,
//     //     email: data.email,
//     //     userName: data.userName,
//     //     customMessage: data?.message,
//     //     formPage: `http://localhost:3000/form?f=${form.id}`,
//     //     code: code,
//     //   },
//     // });

//     // return NextResponse.json({ res });
//     return NextResponse.json({ data });
//   } catch (error) {
//     console.log("FORM_POST", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }



/*
resp
data-body FormData {
  [Symbol(state)]: [
    {
      name: 'demo',
      value: '{"title":"title","rname":"nnnn","email":"john4@gmail.com","message":"Custom Message","dynamicFields":[{"name":"Item One","type":"sign","annotations":[{"annotationType":"text","left":"50px","top":"150px","width":100,"height":20,"value":"mmm","imageType":"","page":1,"role":"creator"}],"file":{},"description":"","required":true},{"name":"itc","type":"sign","annotations":[{"annotationType":"text","left":"50px","top":"150px","width":100,"height":20,"value":",,,,,,","imageType":"","page":1,"role":"creator"}],"file":{},"description":"","required":true}],"userId":"user_2fMKG7PSb4bXmN7J6cPi3t3XHV5","userName":"Pika Singh","sender":"pikasingh2019@gmail.com"}' 
    },
    { name: 'dynamicFields[0]', value: [File] },
    { name: 'dynamicFields[1]', value: [File] }
  ]
}
 file uploaded {
  'dynamicFields[0]': File {
    size: 49017,
    type: 'application/pdf',
    name: '3 28.pdf',
    lastModified: 1737898612215
  },
  'dynamicFields[1]': File {
    size: 49016,
    type: 'application/pdf',
    name: '6 9.pdf',
    lastModified: 1737898612215
  }
}
data-body FormData {
  [Symbol(state)]: [
    {
      name: 'demo',
      value: '{"title":"title","rname":"nnnn","email":"john4@gmail.com","message":"Custom Message","dynamicFields":[{"name":"Item One","type":"sign","annotations":[{"annotationType":"text","left":"50px","top":"150px","width":100,"height":20,"value":"mmm","imageType":"","page":1,"role":"creator"}],"file":{},"description":"","required":true},{"name":"itc","type":"sign","annotations":[{"annotationType":"text","left":"50px","top":"150px","width":100,"height":20,"value":",,,,,,","imageType":"","page":1,"role":"creator"}],"file":{},"description":"","required":true}],"userId":"user_2fMKG7PSb4bXmN7J6cPi3t3XHV5","userName":"Pika Singh","sender":"pikasingh2019@gmail.com"}' 
    },
    { name: 'dynamicFields[0]', value: [File] },
    { name: 'dynamicFields[1]', value: [File] }
  ]
}
 file uploaded {
  'dynamicFields[0]': File {
    size: 49017,
    type: 'application/pdf',
    name: '3 28.pdf',
    lastModified: 1737898612216
  },
  'dynamicFields[1]': File {
    size: 49016,
    type: 'application/pdf',
    name: '6 9.pdf',
    lastModified: 1737898612216
  }
}
first file uploaded [
  {
    data: {
      key: 'e62bd14b-13cb-4bb5-8431-0b9e8281ca2d-x9ar.pdf',
      url: 'https://utfs.io/f/e62bd14b-13cb-4bb5-8431-0b9e8281ca2d-x9ar.pdf',
      name: '3 28.pdf',
      size: 49017,
      type: 'application/pdf',
      customId: null
    },
    error: null
  },
  {
    data: {
      key: 'a78341c3-7437-4c02-b672-b8e92e254fce-14un.pdf',
      url: 'https://utfs.io/f/a78341c3-7437-4c02-b672-b8e92e254fce-14un.pdf',
      name: '6 9.pdf',
      size: 49016,
      type: 'application/pdf',
      customId: null
    },
    error: null
  }
]
first file uploaded [
  {
    data: {
      key: 'ceb668a3-6721-4ba3-a8ac-ea1b4bd07288-x9ar.pdf',
      url: 'https://utfs.io/f/ceb668a3-6721-4ba3-a8ac-ea1b4bd07288-x9ar.pdf',
      name: '3 28.pdf',
      size: 49017,
      type: 'application/pdf',
      customId: null
    },
    error: null
  },
  {
    data: {
      key: 'a1aa2d53-b512-4804-bad5-c0787b707b89-14un.pdf',
      url: 'https://utfs.io/f/a1aa2d53-b512-4804-bad5-c0787b707b89-14un.pdf',
      name: '6 9.pdf',
      size: 49016,
      type: 'application/pdf',
      customId: null
    },
    error: null
  }
]

*/
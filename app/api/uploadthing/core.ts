import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { currentUser } from "@clerk/nextjs/server";
 
const f = createUploadthing();
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 9 }, video: {maxFileSize: "64MB", maxFileCount: 1}, pdf: {maxFileSize: "4MB", maxFileCount: 9}, text:{maxFileSize: "4MB", maxFileCount: 9}, blob: {maxFileSize: "64MB", maxFileCount: 1} })
  // Set permissions and file types for this FileRoute
  .middleware(async ({ req }) => {
    // This code runs on your server before upload
    const auth = await currentUser()
    console.log('uploadthing', auth)
      const user = auth?.id
 
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
 
      console.log("file url", file.url);
 
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
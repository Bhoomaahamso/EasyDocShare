"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  CanvasHTMLAttributes,
} from "react";
import { Button } from "../ui/button";
import { MoveDiagonal2, Pencil } from "lucide-react";
import { PDFDocument, PDFObject, StandardFonts, degrees, rgb } from "pdf-lib";
import { DialogClose } from "../ui/dialog";
let pdfjsLib: { getDocument: ({}) => PDFDocument };
// @ts-ignore
import("pdfjs-dist/webpack.mjs").then((val) => (pdfjsLib = val));

interface annon {
  annotationType: string;
  left: string;
  top: string;
  width: number;
  height: number;
  value: string;
  imageType: string;
  page: number;
  role: string;
}

export default function Test({
  url,
  annotations,
  setAnnotations,
  pdfIndex,
  onSave,
}: {
  url: File;
  annotations: (annon & { fontSize: number })[];
  setAnnotations: Function;
  pdfIndex: number;
  onSave: Function;
}) {
  // debugger;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef(null);
  const valRef = useRef(new Uint8Array());
  // const pdf = useRef<PDFDocument | null>(null);
  const pdf = useRef<({} & { numPages: number; getPage: Function }) | null>(
    null
  );

  // const [pdf, setPdf] = useState();
  const [pdfd, setPdfd] = useState(url);

  // const [annotations, setAnnotations] = useState([]);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<
    number | null
  >(null);
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPreview, setIsPreview] = useState(false);

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  // useEffect(() => {
  //   const hmm = (event) => {
  //     const { clientX, clientY } = event;
  //     setCoords({ x: clientX, y: clientY });
  //     // console.log(`X: ${clientX}, Y: ${clientY}`);
  //   };

  //   window.addEventListener("mousemove", hmm);

  //   // Clean up event listener on component unmount
  //   return () => {
  //     window.removeEventListener("mousemove", hmm);
  //   };
  // }, []);

  function arrayBufferToFile(
    arrayBuffer: Uint8Array,
    fileName: string,
    mimeType: string
  ) {
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const data = new File([blob], fileName, { type: mimeType });
    console.log("blob", data);
    return data;
  }

  const getArrayBuffer = async (val: File) => {
    console.log("URL:-", val);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const arrayBuffer = e.target?.result;
        resolve(arrayBuffer);
      };

      reader.onerror = function (e) {
        reject("Error reading file");
      };

      reader.readAsArrayBuffer(val);
    });
  };

  const renderPage = async () => {
    if (!pdf.current) return;
    // const page = await pdf.getPage(1);
    const page = await pdf.current.getPage(currentPage);
    // const viewport = page.getViewport({ scale: 1.5 });
    debugger;
    const viewport = page.getViewport({ scale: 1 });
    console.log("likk");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) {
      debugger;
    }
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport,
    };
    await page.render(renderContext).promise;
  };

  const loadPDF = async (pdfSource: File) => {
    if (!pdfjsLib) return;
    debugger;
    console.log("pdfd", pdfd);
    // const data = await getArrayBuffer(pdfd);
    const data = await getArrayBuffer(pdfSource);
    // valRef.current
    // ? valRef.current
    // :
    // pdfSource instanceof File
    // ? await getArrayBuffer(pdfSource)
    // : pdfSource;
    // const pdf = await pdfjsLib.getDocument({ data: data }).promise;
    // @ts-ignore
    pdf.current = await pdfjsLib.getDocument({ data: data }).promise;

    console.log("THE PDF", pdf, pdfSource, typeof pdf);
    // setPdf(pdf);
    renderPage();
    // // const page = await pdf.getPage(1);
    // const page = await pdf.getPage(currentPage);
    // // const viewport = page.getViewport({ scale: 1.5 });
    // const viewport = page.getViewport({ scale: 1 });
    // console.log("likk");
    // const canvas = canvasRef.current;
    // const context = canvas.getContext("2d");
    // canvas.height = viewport.height;
    // canvas.width = viewport.width;

    // const renderContext = {
    //   canvasContext: context,
    //   viewport,
    // };
    // await page.render(renderContext).promise;
  };

  useEffect(() => {
    console.log("curr page changed");
    // renderPage();
  }, [currentPage]);

  useEffect(() => {
    // setPdfd(url);
    // loadPDF(url);
    if (pdfjsLib) loadPDF(pdfd);
  }, [pdfjsLib]);

  const handleCanvasClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    role: string
  ) => {
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newAnnotation = {
      annotationType: "text",
      left: "50px",
      top: "150px",
      width: 100,
      height: 20,
      value: "",
      imageType: "",
      page: currentPage,
      role,
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleSignatureClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    role: string
  ) => {
    if (role === "user") {
      const newSignature = {
        annotationType: "signature",
        left: "50px",
        top: "200px",
        width: 200,
        height: 200,
        value: "",
        imageType: "",
        page: currentPage,
        role,
      };
      setAnnotations([...annotations, newSignature]);
      return;
    }
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canva.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const regex = /data:image\/(png|jpeg);base64/;

          const match = (e.target?.result as string).slice(0, 30).match(regex);

          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = (e) => {
            const newSignature = {
              annotationType: "signature",
              left: "50px",
              top: "200px",
              width: 200,
              height: 200,
              value: img.src,
              imageType: match?.[1],
              page: currentPage,
              role,
            };
            setAnnotations([...annotations, newSignature]);
          };
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const editSignature = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canva.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const regex = /data:image\/(png|jpeg);base64/;
          const match = (e.target?.result as string).slice(0, 30).match(regex);

          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = (e) => {
            const updatedAnnotations = annotations.map(
              (annotation: (typeof annotations)[0], i: number) =>
                i === index
                  ? { ...annotation, value: img.src, imageType: match?.[1] }
                  : annotation
            );
            setAnnotations(updatedAnnotations);
            // const newSignature = {
            //   annotationType: "signature",
            //   left: "50px",
            //   top: "200px",
            //   width: 200,
            //   height: 200,
            //   value: img.src,
            //   imageType: match[1],
            //   page: currentPage,
            //   role,
            // };
            // setAnnotations([...annotations, newSignature]);
          };
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const textonMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    let offsetX, offsetY;
    let isDragging = false;
    let startX, startY;

    // isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    offsetX = event.clientX - parseInt(annotations[index].left);
    offsetY = event.clientY - parseInt(annotations[index].top);

    const onMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;

        const updatedSignatures = [...annotations];
        updatedSignatures[index].left = `${event.clientX - offsetX}px`;
        updatedSignatures[index].top = `${event.clientY - offsetY}px`;
        const canva = canvasRef.current;
        if (!canva) return;
        const canvasRect = canva.getBoundingClientRect();

        if (parseInt(updatedSignatures[index].left) < 0) {
          updatedSignatures[index].left = "0px";
        } else if (
          parseInt(updatedSignatures[index].left) +
            updatedSignatures[index].width >
          canvasRect.width
        ) {
          updatedSignatures[index].left = `${
            canvasRect.width - updatedSignatures[index].width
          }px`;
        }

        if (parseInt(updatedSignatures[index].top) < 0) {
          updatedSignatures[index].top = "0px";
        } else if (
          parseInt(updatedSignatures[index].top) +
            updatedSignatures[index].height >
          canvasRect.height
        ) {
          updatedSignatures[index].top = `${
            canvasRect.height - updatedSignatures[index].height
          }px`;
        }

        setAnnotations(updatedSignatures);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleDateClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    role: string
  ) => {
    if (role === "user") {
      const newDate = {
        annotationType: "date",
        left: "100px",
        top: "100px",
        width: 100,
        height: 20,
        value: "",
        imageType: "",
        page: currentPage,
        role,
      };
      setAnnotations([...annotations, newDate]);
      return;
    }
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canva.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const newDate = {
        annotationType: "date",
        left: "100px",
        top: "100px",
        width: 100,
        height: 20,
        value: target.value,
        imageType: "",
        page: currentPage,
        role,
      };
      setAnnotations([...annotations, newDate]);
    };
    dateInput.style.position = "absolute";
    dateInput.style.left = `${100 + scrollX + rect.left}px`;
    dateInput.style.top = `${100 + scrollY + rect.top}px`;
    dateInput.type = "date";
    document.body.appendChild(dateInput);
    dateInput.focus();
    dateInput.showPicker();

    console.log("DATTE", dateInput.style.top, scrollY);
    dateInput.onblur = () => {
      document.body.removeChild(dateInput);
    };
  };

  const editDate = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canva.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      handleAnnotationChange(index, target.value);
      document.body.removeChild(dateInput);
    };
    dateInput.style.position = "absolute";
    dateInput.style.left = `${100 + scrollX + rect.left}px`;
    dateInput.style.top = `${100 + scrollY + rect.top}px`;
    dateInput.type = "date";
    document.body.appendChild(dateInput);
    dateInput.focus();
    dateInput.showPicker();
    console.log("DATTE", dateInput.style.top, scrollY);
  };

  const handleAnnotationChange = (index: number, value: string) => {
    const updatedAnnotations = annotations.map(
      (annotation: (typeof annotations)[0], i: number) =>
        i === index ? { ...annotation, value } : annotation
    );
    setAnnotations(updatedAnnotations);
  };

  const handleAnnotationDelete = (index: number) => {
    const updatedAnnotations = annotations.filter(
      (_: (typeof annotations)[0], i: number) => i !== index
    );
    setAnnotations(updatedAnnotations);
  };

  const handleMouseDown = (
    index: number,
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    setResizingIndex(index);
    setResizeStart({
      startX: event.clientX,
      startY: event.clientY,
      startWidth: annotations[index].width,
      startHeight: annotations[index].height,
    });
    event.stopPropagation();
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (resizingIndex !== null && resizeStart) {
      const dx = event.clientX - resizeStart.startX;
      const dy = event.clientY - resizeStart.startY;
      const newWidth = resizeStart.startWidth + dx;
      const newHeight = resizeStart.startHeight + dy;
      const updatedAnnotations = annotations.map((annotation, i) =>
        i === resizingIndex
          ? {
              ...annotation,
              width: newWidth,
              height:
                annotation.annotationType === "signature"
                  ? newHeight
                  : 1.2 * newHeight,
              fontSize: newHeight,
            }
          : annotation
      );
      setAnnotations(updatedAnnotations);
    }
  };

  const handleMouseUp = () => {
    setResizingIndex(null);
    setResizeStart(null);
  };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(
  //     localStorage.getItem("annotations") || "[]"
  //   );
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem("annotations", JSON.stringify(annotations));
  //   };
  //   window.addEventListener("beforeunload", saveAnnotations);
  //   return () => window.removeEventListener("beforeunload", saveAnnotations);
  // }, [annotations]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const handleSave = () => {
    const newAnnotations = annotations.filter(annotation => annotation.role === "user");
    setAnnotations(newAnnotations);
    onSave(pdfIndex, pdfd);
    setIsPreview(false);
  };

  const handleBack = () => {
    loadPDF(url);
    setIsPreview(false);
  };

  const print = async () => {
    console.log("aMM", annotations, url);
    // const existingPdfBytes = await getArrayBuffer(url);
    console.log("pdfd", pdfd);
    setIsPreview(true);
    // const existingPdfBytes = await getArrayBuffer(pdfd);
    const existingPdfBytes = await getArrayBuffer(url);
    const pdfDoc = await PDFDocument.load(existingPdfBytes as Uint8Array);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    // const { width, height } = firstPage.getSize();
    const canva = canvasRef.current;
    if (!canva) return;
    const rect = canva.getBoundingClientRect();
    annotations.forEach(async (val: (typeof annotations)[0]) => {
      if (val.role !== "creator") return;
      console.log("rect", rect);

      if (val.annotationType === "signature") {
        let img;
        console.log("val", val);
        if (val.imageType === "png") {
          img = await pdfDoc.embedPng(val.value);
        } else if (val.imageType === "jpeg") {
          img = await pdfDoc.embedJpg(val.value);
        }
        if (!img) return;
        // firstPage.drawImage(img, {
        pages[val.page - 1].drawImage(img, {
          x: parseInt(val.left),
          y: rect.height - parseInt(val.top) - val.height,
          width: val.width,
          height: val.height,
        });
      } else {
        // firstPage.drawText(val.value, {
        pages[val.page - 1].drawText(val.value, {
          x: parseInt(val.left),
          y: rect.height - parseInt(val.top) - val.height / 1.2,
          size: val.height / 1.2,
          font: helveticaFont,
          color: rgb(0.95, 0.1, 0.1),
        });
      }
    });
    debugger;
    const pdfBytes = await pdfDoc.save();
    // const newFile = arrayBufferToFile(pdfBytes, `${Date.now()}.pdf`, "application/pdf");
    const newFile = arrayBufferToFile(
      pdfBytes,
      `${new Date(Date.now()).getMinutes()} ${new Date(
        Date.now()
      ).getSeconds()}.pdf`,
      "application/pdf"
    );
    setPdfd(newFile);
    valRef.current = pdfBytes;
    // onSave(pdfIndex, pdfBytes);
    // onSave(pdfIndex, newFile);
    // loadPDF(pdfBytes);
    // loadPDF(pdfd);
    loadPDF(newFile);
    // return;

    console.log("PDF", pdfBytes);
  };

  const nextPage = () =>
    pdf?.current?.numPages &&
    currentPage < pdf.current.numPages &&
    setCurrentPage(currentPage + 1);

  const prevPage = () =>
    pdf && currentPage > 1 && setCurrentPage(currentPage - 1);

  /// MAKE DB SCHEMA FOR THIS SHIT, HOW MANY TABLES R NEEDED  ✔️
  /// FIND A WAY TO STORE INTERACTIVE ELEMS FOR USER
  /// MAYBE I DONT NEED 3 TYPES, MAYBE 1 WILL DO???  ✔️
  /// HANDLE FOR MULTIPLE PAGES ✔️
  /// MAKE UI FOR FORM PDF

  return (
    <div className="flex min-w-fit">
      <div className="w-fit min-w-32 h-96 mx-8">
        <div className="flex flex-col">
          <Button onClick={prevPage}>prev</Button>
          <Button onClick={nextPage}>next</Button>
          <h1>Add Recipients Fields</h1>
          {/* <p>
            Current coordinates: X: {coords.x}, Y: {coords.y}
          </p> */}
          <Button
            onClick={(e) => handleCanvasClick(e, "user")}
            variant="outline"
          >
            Text
          </Button>
          <Button
            onClick={(e) => handleSignatureClick(e, "user")}
            className=" p-2 bg-blue-500 text-white rounded"
          >
            Sign
          </Button>
          <Button
            onClick={(e) => handleDateClick(e, "user")}
            className=" p-2 bg-green-500 text-white rounded"
            variant="outline"
          >
            Date
          </Button>
        </div>
        <div className="flex flex-col">
          <h1>Add Annotations</h1>
          <Button
            onClick={(e) => handleCanvasClick(e, "creator")}
            variant="outline"
          >
            Text
          </Button>
          <Button
            onClick={(e) => handleSignatureClick(e, "creator")}
            className=" p-2 bg-blue-500 text-white rounded"
          >
            Sign
          </Button>
          <Button
            onClick={(e) => handleDateClick(e, "creator")}
            className=" p-2 bg-green-500 text-white rounded"
            variant="outline"
          >
            Date
          </Button>
        </div>
        {!isPreview ? (
          <div className="">
            <Button onClick={print}>Preview</Button>
          </div>
        ) : (
          <div className="">
            <Button onClick={handleBack}>Back</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        )}
        <div className="">
          {/* <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose> */}
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <canvas ref={canvasRef} className="border" />
        {annotations.map(
          (annotation: (typeof annotations)[0], index: number) => {
            if (annotation.page !== currentPage) return;
            if (isPreview && annotation.role === "creator") return;
            if (annotation.annotationType === "text")
              return (
                <div
                  key={index}
                  className="group"
                  style={{
                    position: "absolute",
                    left: annotation.left,
                    top: annotation.top,
                    backgroundColor: `${
                      annotation.role === "user" ? "blue" : ""
                    }`,
                  }}
                  onMouseDown={(event) =>
                    !isPreview && textonMouseDown(event, index)
                  }
                  onMouseEnter={() => setHoveredAnnotationIndex(index)}
                  onMouseLeave={() => setHoveredAnnotationIndex(null)}
                >
                  <input
                    className="bg-transparent border border-red-500 resize-none -trackings-[3px]"
                    style={{
                      width: `${annotation.width}px`,
                      height: `${annotation.height}px`,
                      fontSize: `${annotation.fontSize}px`,
                    }}
                    value={annotation.value}
                    readOnly={annotation.role === "user"}
                    onChange={(e) => {
                      annotation.role === "creator" &&
                        handleAnnotationChange(index, e.target.value);
                    }}
                  />
                  {hoveredAnnotationIndex === index && !isPreview && (
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white p-1"
                      onClick={() => handleAnnotationDelete(index)}
                    >
                      X
                    </button>
                  )}
                  {!isPreview && (
                    <div
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                      onMouseDown={(event) => handleMouseDown(index, event)}
                    >
                      <MoveDiagonal2
                        size={12}
                        color="#ffffff"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                </div>
              );
            else if (annotation.annotationType === "signature")
              return (
                <div
                  key={index}
                  className="group"
                  style={{
                    position: "absolute",
                    left: annotation.left,
                    top: annotation.top,
                    width: `${annotation.width}px`,
                    height: `${annotation.height}px`,
                    backgroundColor: `${
                      annotation.role === "user" ? "blue" : ""
                    }`,
                  }}
                  onMouseDown={(event) =>
                    !isPreview && textonMouseDown(event, index)
                  }
                  onMouseEnter={() => setHoveredAnnotationIndex(index)}
                  onMouseLeave={() => setHoveredAnnotationIndex(null)}
                >
                  {annotation.role === "creator" && (
                    <img
                      src={annotation.value}
                      alt="Signature"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      draggable={false}
                    />
                  )}
                  {hoveredAnnotationIndex === index && !isPreview && (
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white p-1"
                      onClick={() => handleAnnotationDelete(index)}
                    >
                      X
                    </button>
                  )}
                  {hoveredAnnotationIndex === index &&
                    !isPreview &&
                    annotation.role === "creator" && (
                      <div
                        className="absolute bottom-0 left-0 bg-yellow-500 text-white p-1 cursor-pointer"
                        onClick={(e) => editSignature(e, index)}
                      >
                        <Pencil size={12} strokeWidth={1} />
                      </div>
                    )}
                  {!isPreview && (
                    <div
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                      onMouseDown={(event) => handleMouseDown(index, event)}
                    >
                      <MoveDiagonal2
                        size={12}
                        color="#ffffff"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                </div>
              );
            else if (annotation.annotationType === "date")
              return (
                <div
                  key={index}
                  className="group bg-transparent hover:text-red-500"
                  style={{
                    position: "absolute",
                    left: annotation.left,
                    top: annotation.top,
                    backgroundColor: `${
                      annotation.role === "user" ? "blue" : ""
                    }`,
                    padding: "2px",
                    // border: "1px solid black",
                  }}
                  onMouseDown={(event) =>
                    !isPreview && textonMouseDown(event, index)
                  }
                  onMouseEnter={() => setHoveredAnnotationIndex(index)}
                  onMouseLeave={() => setHoveredAnnotationIndex(null)}
                >
                  <input
                    className="bg-transparent border border-red-500 resize-none -trackings-[3px]"
                    style={{
                      width: `${annotation.width}px`,
                      height: `${annotation.height}px`,
                      fontSize: `${annotation.fontSize}px`,
                    }}
                    // readOnly="true"
                    value={annotation.value}
                  />
                  {hoveredAnnotationIndex === index && !isPreview && (
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white p-1"
                      onClick={() => handleAnnotationDelete(index)}
                    >
                      X
                    </button>
                  )}
                  {hoveredAnnotationIndex === index &&
                    !isPreview &&
                    annotation.role === "creator" && (
                      <div
                        className="absolute bottom-0 left-0 bg-yellow-500 text-white p-1 cursor-pointer"
                        onClick={(e) => editDate(e, index)}
                      >
                        <Pencil size={12} strokeWidth={1} />
                      </div>
                    )}
                  {!isPreview && (
                    <div
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                      onMouseDown={(event) => handleMouseDown(index, event)}
                    >
                      <MoveDiagonal2
                        size={12}
                        color="#ffffff"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                </div>
              );
          }
        )}
      </div>
    </div>
  );
}

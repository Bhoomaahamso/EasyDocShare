"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  CanvasHTMLAttributes,
} from "react";
import { Button } from "../ui/button";
import { MoveDiagonal2 } from "lucide-react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
let pdfjsLib;
import("pdfjs-dist/webpack.mjs").then((val) => (pdfjsLib = val));

export default function Test({ url }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [annotations, setAnnotations] = useState([]);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  const [resizingIndex, setResizingIndex] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [pdf, setPdf] = useState();
  const [currentPage, setCurrentPage] = useState(1);

  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const hmm = (event) => {
      const { clientX, clientY } = event;
      setCoords({ x: clientX, y: clientY });
      // console.log(`X: ${clientX}, Y: ${clientY}`);
    };

    window.addEventListener("mousemove", hmm);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("mousemove", hmm);
    };
  }, []);

  const renderPage = async () => {
    if (!pdf) return;
    // const page = await pdf.getPage(1);
    const page = await pdf.getPage(currentPage);
    // const viewport = page.getViewport({ scale: 1.5 });
    const viewport = page.getViewport({ scale: 1 });
    console.log("likk");
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport,
    };
    await page.render(renderContext).promise;
  };

  const loadPDF = async (pdfSource) => {
    if (!pdfjsLib) return;
    const pdf =
      typeof pdfSource === "string"
        ? await pdfjsLib.getDocument(pdfSource).promise
        : await pdfjsLib.getDocument({ data: pdfSource }).promise;

    console.log("THE PDF", pdf);
    setPdf(pdf);
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
    renderPage();
  }, [currentPage, pdf]);

  useEffect(() => {
    loadPDF(url);
  }, [pdfjsLib]);

  const handleCanvasClick = (event, role) => {
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

  const handleSignatureClick = (event, role) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const regex = /data:image\/(png|jpeg);base64/;
          const match = e.target.result?.slice(0, 30).match(regex);

          const img = new Image();
          img.src = e.target.result;
          img.onload = (e) => {
            const newSignature = {
              annotationType: "signature",
              left: "50px",
              top: "200px",
              width: img.width / 4,
              height: img.height / 4,
              value: img.src,
              imageType: match[1],
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

  const textonMouseDown = (event, index) => {
    let offsetX, offsetY;
    let isDragging = false;
    let startX, startY;

    // isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    offsetX = event.clientX - parseInt(annotations[index].left);
    offsetY = event.clientY - parseInt(annotations[index].top);

    const onMouseMove = (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;

        const updatedSignatures = [...annotations];
        updatedSignatures[index].left = `${event.clientX - offsetX}px`;
        updatedSignatures[index].top = `${event.clientY - offsetY}px`;

        const canvasRect = canvasRef.current.getBoundingClientRect();

        if (parseInt(updatedSignatures[index].left) < 0) {
          updatedSignatures[index].left = "0px";
        } else if (
          parseInt(updatedSignatures[index].left) +
            updatedSignatures[index].width >
          canvasRect.width
        ) {
          updatedSignatures[index].left =
            canvasRect.width - updatedSignatures[index].width;
        }

        if (parseInt(updatedSignatures[index].top) < 0) {
          updatedSignatures[index].top = "0px";
        } else if (
          parseInt(updatedSignatures[index].top) +
            updatedSignatures[index].height >
          canvasRect.height
        ) {
          updatedSignatures[index].top =
            canvasRect.height - updatedSignatures[index].height;
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

  const handleDateClick = (event, role) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.onchange = (e) => {
      const newDate = {
        annotationType: "date",
        left: "100px",
        top: "100px",
        width: 100,
        height: 20,
        value: e.target.value,
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

  const handleAnnotationChange = (index, value) => {
    const updatedAnnotations = annotations.map((annotation, i) =>
      i === index ? { ...annotation, value } : annotation
    );
    setAnnotations(updatedAnnotations);
  };

  const handleAnnotationDelete = (index) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(updatedAnnotations);
  };

  const handleMouseDown = (index, event, type) => {
    setResizingIndex(index);
    setResizeStart({
      startX: event.clientX,
      startY: event.clientY,
      startWidth: annotations[index].width,
      startHeight: annotations[index].height,
    });
    event.stopPropagation();
  };

  const handleMouseMove = (event) => {
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

  const print = async () => {
    console.log("aMM", annotations);
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    // const { width, height } = firstPage.getSize();

    const rect = canvasRef.current.getBoundingClientRect();
    annotations.forEach(async (val) => {
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

    const pdfBytes = await pdfDoc.save();
    loadPDF(pdfBytes);
    console.log("PDF", pdfBytes);
  };

  const nextPage = () =>
    pdf && currentPage < pdf.numPages && setCurrentPage(currentPage + 1);

  const prevPage = () =>
    pdf && currentPage > 1 && setCurrentPage(currentPage - 1);

  /// MAKE DB SCHEMA FOR THIS SHIT, HOW MANY TABLES R NEEDED  ✔️
  /// FIND A WAY TO STORE INTERACTIVE ELEMS FOR USER
  /// MAYBE I DONT NEED 3 TYPES, MAYBE 1 WILL DO???  ✔️
  /// HANDLE FOR MULTIPLE PAGES ✔️

  return (
    <>
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
        <div className="">
          <Button onClick={print}>Save</Button>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <canvas ref={canvasRef} className="border" />
        {annotations.map((annotation, index) => {
          if (annotation.page !== currentPage) return;
          if (annotation.annotationType === "text")
            return (
              <div
                key={index}
                className="group"
                style={{
                  position: "absolute",
                  left: annotation.left,
                  top: annotation.top,
                }}
                onMouseDown={(event) => textonMouseDown(event, index)}
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
                  onChange={(e) =>
                    handleAnnotationChange(index, e.target.value)
                  }
                />
                {hoveredAnnotationIndex === index && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1"
                    onClick={() => handleAnnotationDelete(index)}
                  >
                    X
                  </button>
                )}
                <div
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                  onMouseDown={(event) => handleMouseDown(index, event, "a")}
                >
                  <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
                </div>
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
                }}
                onMouseDown={(event) => textonMouseDown(event, index)}
                onMouseEnter={() => setHoveredAnnotationIndex(index)}
                onMouseLeave={() => setHoveredAnnotationIndex(null)}
              >
                <img
                  src={annotation.value}
                  alt="Signature"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  draggable={false}
                />
                {hoveredAnnotationIndex === index && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1"
                    onClick={() => handleAnnotationDelete(index)}
                  >
                    X
                  </button>
                )}
                <div
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                  onMouseDown={(event) => handleMouseDown(index, event, "a")}
                >
                  <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
                </div>
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
                  // backgroundColor: "white",
                  padding: "2px",
                  // border: "1px solid black",
                }}
                onMouseDown={(event) => textonMouseDown(event, index)}
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
                  readOnly="true"
                  value={annotation.value}
                />
                {hoveredAnnotationIndex === index && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1"
                    onClick={() => handleAnnotationDelete(index)}
                  >
                    X
                  </button>
                )}
                <div
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
                  onMouseDown={(event) => handleMouseDown(index, event, "a")}
                >
                  <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
                </div>
              </div>
            );
        })}
      </div>
    </>
  );
}

"use client";
// side btns, when i add annotation, then it should be printed, when for them, it should be saved in state.
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
  const [signatures, setSignatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  const [hoveredSignatureIndex, setHoveredSignatureIndex] = useState(null);
  const [hoveredDateIndex, setHoveredDateIndex] = useState(null);
  const [resizingIndex, setResizingIndex] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [qelem, setQelem] = useState(null);
  const [buttonPositions, setButtonPositions] = useState({
    addSignature: { x: 20, y: 20 },
    addDate: { x: 140, y: 20 },
  });
  const [draggingButton, setDraggingButton] = useState(null);

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

  const loadPDF = async (pdfUrl) => {
    if (!pdfjsLib) return;
    const pdf =
      typeof pdfUrl === "string"
        ? await pdfjsLib.getDocument(pdfUrl).promise
        : await pdfjsLib.getDocument({ data: pdfUrl }).promise;
    const page = await pdf.getPage(1);
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

  useEffect(() => {
    loadPDF(url);
  }, [pdfjsLib]);

  const handleCanvasClick = (event, role) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newAnnotation = {
      role,
      left: `${50}px`,
      top: `${150}px`,
      width: 100,
      height: 20,
      value: "",
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

          // console.log('IMG', fileInput,file,e,match[1]);
          const img = new Image();
          img.src = e.target.result;
          img.onload = (e) => {
            // console.log('omload',e)
            const newSignature = {
              role,
              left: `${50}px`,
              top: `${200}px`,
              width: img.width / 4, // Adjust size as needed
              height: img.height / 4, // Adjust size as needed
              src: img.src,
              type: match[1],
            };
            setSignatures([...signatures, newSignature]);
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

    isDragging = false;
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
        role,
        left: `${100}px`,
        top: `${100}px`,
        width: 100,
        height: 20,
        value: e.target.value,
      };
      setDates([...dates, newDate]);
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

  const signatureOnMouseDown = (event, index) => {
    let offsetX, offsetY;
    let isDragging = false;
    let startX, startY;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    offsetX = event.clientX - parseInt(signatures[index].left);
    offsetY = event.clientY - parseInt(signatures[index].top);

    const onMouseMove = (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;

        const updatedSignatures = [...signatures];
        updatedSignatures[index].left = `${event.clientX - offsetX}px`;
        updatedSignatures[index].top = `${event.clientY - offsetY}px`;
        setSignatures(updatedSignatures);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const dateOnMouseDown = (event, index) => {
    let offsetX, offsetY;
    let isDragging = false;
    let startX, startY;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    offsetX = event.clientX - parseInt(dates[index].left);
    offsetY = event.clientY - parseInt(dates[index].top);

    const onMouseMove = (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;

        const updatedSignatures = [...dates];
        updatedSignatures[index].left = `${event.clientX - offsetX}px`;
        updatedSignatures[index].top = `${event.clientY - offsetY}px`;
        setDates(updatedSignatures);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
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

  const handleSignatureDelete = (index) => {
    const updatedSignatures = signatures.filter((_, i) => i !== index);
    setSignatures(updatedSignatures);
  };

  const handleDateDelete = (index) => {
    const updatedDates = dates.filter((_, i) => i !== index);
    setDates(updatedDates);
  };

  useEffect(() => {
    console.log(
      "INDEX",
      hoveredAnnotationIndex,
      hoveredSignatureIndex,
      hoveredDateIndex
    );
  }, [hoveredAnnotationIndex, hoveredSignatureIndex, hoveredDateIndex]);

  const handleMouseDown = (index, event, type) => {
    setResizingIndex(index);
    const elem = type === "a" ? annotations : type === "s" ? signatures : dates;

    setResizeStart({
      startX: event.clientX,
      startY: event.clientY,
      startWidth: elem[index].width,
      startHeight: elem[index].height,
    });
    setQelem(type);
    event.stopPropagation();
  };

  const handleMouseMove = (event) => {
    // debugger;
    if (resizingIndex !== null && resizeStart) {
      console.log(
        "INDEX",
        hoveredAnnotationIndex,
        hoveredSignatureIndex,
        hoveredDateIndex
      );

      const dx = event.clientX - resizeStart.startX;
      const dy = event.clientY - resizeStart.startY;
      const newWidth = resizeStart.startWidth + dx;
      const newHeight = resizeStart.startHeight + dy;
      if (qelem === "a") {
        const updatedAnnotations = annotations.map((annotation, i) =>
          i === resizingIndex
            ? {
                ...annotation,
                width: newWidth,
                height: 1.2 * newHeight,
                fontSize: newHeight,
              }
            : annotation
        );
        setAnnotations(updatedAnnotations);
      } else if (qelem === "s") {
        const updatedAnnotations = signatures.map((annotation, i) =>
          i === resizingIndex
            ? {
                ...annotation,
                width: newWidth,
                height: newHeight,
              }
            : annotation
        );
        setSignatures(updatedAnnotations);
      } else if (qelem === "d") {
        const updatedAnnotations = dates.map((annotation, i) =>
          i === resizingIndex
            ? {
                ...annotation,
                width: newWidth,
                height: 1.2 * newHeight,
                fontSize: newHeight,
              }
            : annotation
        );
        setDates(updatedAnnotations);
      }
    }
    // else if (draggingButton) {
    //   debugger;
    //   const newPositions = { ...buttonPositions };
    //   newPositions[draggingButton].x =
    //     event.clientX - containerRef.current.getBoundingClientRect().left - 50;
    //   newPositions[draggingButton].y =
    //     event.clientY - containerRef.current.getBoundingClientRect().top - 20;
    //   setButtonPositions(newPositions);
    // }
  };

  const handleMouseUp = () => {
    setResizingIndex(null);
    setResizeStart(null);
    setDraggingButton(null);
    setQelem(null);
  };

  // const handleDragStart = (button) => {
  //   setDraggingButton(button);
  // };

  useEffect(() => {
    const savedAnnotations = JSON.parse(
      localStorage.getItem("annotations") || "[]"
    );
    setAnnotations(savedAnnotations);
  }, []);

  useEffect(() => {
    const saveAnnotations = () => {
      localStorage.setItem("annotations", JSON.stringify(annotations));
    };
    window.addEventListener("beforeunload", saveAnnotations);
    return () => window.removeEventListener("beforeunload", saveAnnotations);
  }, [annotations]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const print = async () => {
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    // firstPage.drawText('This text was added with JavaScript!', {
    //   x: 5,
    //   y: height / 2 + 300,
    //   size: 50,
    //   font: helveticaFont,
    //   color: rgb(0.95, 0.1, 0.1),
    //   rotate: degrees(-45),
    // })
    // const newAnnotation = {
    //   role,
    //   left: `${50}px`,
    //   top: `${150}px`,
    //   width: 100,
    //   height: 20,
    //   value: "",
    // };
    const rect = canvasRef.current.getBoundingClientRect();
    annotations.forEach((val) => {
      if (val.role !== "creator") return;
      console.log("rect", rect);
      firstPage.drawText(val.value, {
        x: parseInt(val.left),
        y: rect.height - parseInt(val.top) - val.height / 1.2,
        size: val.height / 1.2,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        // rotate: degrees(-45),
      });
    });
    // const newDate = {
    //   role,
    //   left: `${100}px`,
    //   top: `${100}px`,
    //   width: 100,
    //   height: 20,
    //   value: e.target.value,
    // };
    dates.forEach((val) => {
      if (val.role !== "creator") return;
      console.log("rect", rect);
      firstPage.drawText(val.value, {
        x: parseInt(val.left),
        y: rect.height - parseInt(val.top) - val.height / 1.2,
        size: val.height / 1.2,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        // rotate: degrees(-45),
      });
    });

    signatures.map(async (val) => {
      if (val.role !== "creator") return;
      let img;
      // debugger
      console.log('val',val)
      if (val.type === "png") {
        img = await pdfDoc.embedPng(val.src);
      } else if (val.type === "jpeg") {
        img = await pdfDoc.embedJpg(val.src);
      }


      firstPage.drawImage(img, {
        x: parseInt(val.left),
        y: rect.height - parseInt(val.top) - val.height,
        width: val.width,
        height: val.height,
      });
    });

    const pdfBytes = await pdfDoc.save();
    loadPDF(pdfBytes);
    console.log("PDF", pdfBytes);
  };

  /// MAKE DB SCHEMA FOR THIS SHIT, HOW MANY TABLES R NEEDED
  /// FIND A WAY TO STORE INTERACTIVE ELEMS FOR USER
///// MAYBE I DONT NEED 3 TYPES, MAYBE 1 WILL DO???

  return (
    <>
      <div className="w-fit min-w-32 h-96 mx-8">
        <div className="flex flex-col">
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
            // onMouseDown={() => handleDragStart("addSignature")}
            className=" p-2 bg-blue-500 text-white rounded"
          >
            Sign
          </Button>
          <Button
            onClick={(e) => handleDateClick(e, "user")}
            // onMouseDown={() => handleDragStart("addDate")}
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
            // onMouseDown={() => handleDragStart("addSignature")}
            className=" p-2 bg-blue-500 text-white rounded"
          >
            Sign
          </Button>
          <Button
            onClick={(e) => handleDateClick(e, "creator")}
            // onMouseDown={() => handleDragStart("addDate")}
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
        <canvas
          ref={canvasRef}
          // onClick={handleCanvasClick}
          className="border"
        />
        {annotations.map((annotation, index) => (
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
              onChange={(e) => handleAnnotationChange(index, e.target.value)}
            />
            {hoveredAnnotationIndex === index && (
              // <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              //   <button
              //     onClick={() => handleAnnotationDelete(index)}
              //     className="text-xs text-red-500 hover:text-red-700"
              //   >
              //     Delete
              //   </button>
              // </div>
              <button
                className="absolute top-0 right-0 bg-red-500 text-white p-1"
                onClick={() => handleAnnotationDelete(index)}
              >
                X
              </button>
            )}
            {/* <div
              className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "a")}
            ></div> */}
            <div
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "a")}
            >
              <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
            </div>
          </div>
        ))}
        {signatures.map((signature, index) => (
          <div
            key={index}
            className="group"
            style={{
              position: "absolute",
              left: signature.left,
              top: signature.top,
              width: `${signature.width}px`,
              height: `${signature.height}px`,
            }}
            onMouseDown={(event) => signatureOnMouseDown(event, index)}
            onMouseEnter={() => setHoveredSignatureIndex(index)}
            onMouseLeave={() => setHoveredSignatureIndex(null)}
          >
            <img
              src={signature.src}
              alt="Signature"
              style={{
                width: "100%",
                height: "100%",
              }}
              draggable={false}
            />
            {hoveredSignatureIndex === index && (
              // <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              //   <button
              //     onClick={() => handleSignatureDelete(index)}
              //     className="text-xs text-red-500 hover:text-red-700"
              //   >
              //     Delete
              //   </button>
              // </div>
              <button
                className="absolute top-0 right-0 bg-red-500 text-white p-1"
                onClick={() => handleSignatureDelete(index)}
              >
                X
              </button>
            )}
            {/* <div
              className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "s")}
            ></div> */}
            <div
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "s")}
            >
              <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
            </div>
          </div>
        ))}
        {dates.map((date, index) => (
          <div
            key={index}
            className="group bg-transparent hover:text-red-500"
            style={{
              position: "absolute",
              left: date.left,
              top: date.top,
              // backgroundColor: "white",
              padding: "2px",
              // border: "1px solid black",
            }}
            onMouseDown={(event) => dateOnMouseDown(event, index)}
            onMouseEnter={() => setHoveredDateIndex(index)}
            onMouseLeave={() => setHoveredDateIndex(null)}
          >
            <input
              className="bg-transparent border border-red-500 resize-none -trackings-[3px]"
              style={{
                width: `${date.width}px`,
                height: `${date.height}px`,
                fontSize: `${date.fontSize}px`,
              }}
              value={date.value}
              // onChange={(e) => handleAnnotationChange(index, e.target.value)}
            />
            {hoveredDateIndex === index && (
              // <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              //   <button
              //     onClick={() => handleDateDelete(index)}
              //     className="text-xs text-red-500 hover:text-red-700"
              //   >
              //     Delete
              //   </button>
              // </div>
              <button
                className="absolute top-0 right-0 bg-red-500 text-white p-1"
                onClick={() => handleDateDelete(index)}
              >
                X
              </button>
            )}
            {/* <div
              className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "d")}
              ></div> */}
            <div
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 cursor-se-resize"
              onMouseDown={(event) => handleMouseDown(index, event, "d")}
            >
              <MoveDiagonal2 size={12} color="#ffffff" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

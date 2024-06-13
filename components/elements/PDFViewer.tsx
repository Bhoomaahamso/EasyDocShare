"use client";
// side btns, when i add annotation, then it should be printed, when for them, it should be saved in state.
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  CanvasHTMLAttributes,
} from "react";
// import pdfjsLib from "pdfjs-dist/build/pdf";
// import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
let pdfjsLib;
import("pdfjs-dist/webpack.mjs").then((val) => (pdfjsLib = val));
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs";

export default function PdfViewer({ url }) {
  // const canvasRef = useRef();

  // const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  // const buttonRefs = [useRef(null), useRef(null), useRef(null)];
  const canvasRefs = [useRef(null)];
  const buttonRefs = [useRef(null)];

  const [pdfRef, setPdfRef] = useState();
  const [currentPage, setCurrentPage] = useState(1);


  // add del for img

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
  const [buttonPositions, setButtonPositions] = useState({
    addSignature: { x: 20, y: 20 },
    addDate: { x: 140, y: 20 },
  });
  const [draggingButton, setDraggingButton] = useState(null);

  useEffect(() => {
    const loadPDF = async () => {
      if(!pdfjsLib)return
      const pdf = await pdfjsLib.getDocument(url).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };
      await page.render(renderContext).promise;
    };
    loadPDF();
  }, [pdfjsLib]);

  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newAnnotation = {
      left: `${x}px`,
      top: `${y}px`,
      width: 100,
      height: 20,
      value: '',
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleSignatureClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            const newSignature = {
              left: `${x}px`,
              top: `${y}px`,
              width: img.width / 4, // Adjust size as needed
              height: img.height / 4, // Adjust size as needed
              src: img.src,
            };
            setSignatures([...signatures, newSignature]);
          };
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handleDateClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.onchange = (e) => {
      const newDate = {
        left: `${x}px`,
        top: `${y}px`,
        value: e.target.value,
      };
      setDates([...dates, newDate]);
    };
    dateInput.style.position = 'absolute';
    dateInput.style.left = `${event.clientX}px`;
    dateInput.style.top = `${event.clientY}px`;
    document.body.appendChild(dateInput);
    dateInput.click();
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

  const handleSignatureDelete = (index) => {
    const updatedSignatures = signatures.filter((_, i) => i !== index);
    setSignatures(updatedSignatures);
  };

  const handleDateDelete = (index) => {
    const updatedDates = dates.filter((_, i) => i !== index);
    setDates(updatedDates);
  };

  const handleMouseDown = (index, event) => {
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
          ? { ...annotation, width: newWidth, height: newHeight }
          : annotation
      );
      setAnnotations(updatedAnnotations);
    } else if (draggingButton) {
      const newPositions = { ...buttonPositions };
      newPositions[draggingButton].x = event.clientX - containerRef.current.getBoundingClientRect().left - 50;
      newPositions[draggingButton].y = event.clientY - containerRef.current.getBoundingClientRect().top - 20;
      setButtonPositions(newPositions);
    }
  };

  const handleMouseUp = () => {
    setResizingIndex(null);
    setResizeStart(null);
    setDraggingButton(null);
  };

  const handleDragStart = (button) => {
    setDraggingButton(button);
  };

  useEffect(() => {
    const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
    setAnnotations(savedAnnotations);
  }, []);

  useEffect(() => {
    const saveAnnotations = () => {
      localStorage.setItem('annotations', JSON.stringify(annotations));
    };
    window.addEventListener('beforeunload', saveAnnotations);
    return () => window.removeEventListener('beforeunload', saveAnnotations);
  }, [annotations]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  return (
    <div ref={containerRef} className="relative">
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
      <button
        onClick={handleSignatureClick}
        onMouseDown={() => handleDragStart('addSignature')}
        className="absolute p-2 bg-blue-500 text-white rounded"
        style={{
          left: `${buttonPositions.addSignature.x}px`,
          top: `${buttonPositions.addSignature.y}px`,
          cursor: 'move',
        }}
      >
        Add Signature
      </button>
      <button
        onClick={handleDateClick}
        onMouseDown={() => handleDragStart('addDate')}
        className="absolute p-2 bg-green-500 text-white rounded"
        style={{
          left: `${buttonPositions.addDate.x}px`,
          top: `${buttonPositions.addDate.y}px`,
          cursor: 'move',
        }}
      >
        Add Date
      </button>
      {annotations.map((annotation, index) => (
        <div
          key={index}
          className="group"
          style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
          onMouseEnter={() => setHoveredAnnotationIndex(index)}
          onMouseLeave={() => setHoveredAnnotationIndex(null)}
        >
          <textarea
            className="bg-transparent border border-red-500 resize-none"
            style={{ width: `${annotation.width}px`, height: `${annotation.height}px` }}
            value={annotation.value}
            onChange={(e) => handleAnnotationChange(index, e.target.value)}
          />
          {hoveredAnnotationIndex === index && (
            <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              <button
                onClick={() => handleAnnotationDelete(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          )}
          <div
            className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
            onMouseDown={(event) => handleMouseDown(index, event)}
          ></div>
        </div>
      ))}
      {signatures.map((signature, index) => (
        <div
          key={index}
          className="group"
          style={{
            position: 'absolute',
            left: signature.left,
            top: signature.top,
            width: `${signature.width}px`,
            height: `${signature.height}px`,
          }}
          onMouseEnter={() => setHoveredSignatureIndex(index)}
          onMouseLeave={() => setHoveredSignatureIndex(null)}
        >
          <img
            src={signature.src}
            alt="Signature"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          {hoveredSignatureIndex === index && (
            <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              <button
                onClick={() => handleSignatureDelete(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
      {dates.map((date, index) => (
        <div
          key={index}
          className="group hover:text-red-500"
          style={{
            position: 'absolute',
            left: date.left,
            top: date.top,
            backgroundColor: 'white',
            padding: '2px',
            border: '1px solid black',
          }}
          onMouseEnter={() => setHoveredDateIndex(index)}
          onMouseLeave={() => setHoveredDateIndex(null)}
        >
          {date.value}
          {hoveredDateIndex === index && (
            <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
              <button
                onClick={() => handleDateDelete(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );




  // add  del and drag  na
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [signatures, setSignatures] = useState([]);
  // const [dates, setDates] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  // const [hoveredSignatureIndex, setHoveredSignatureIndex] = useState(null);
  // const [hoveredDateIndex, setHoveredDateIndex] = useState(null);
  // const [resizingIndex, setResizingIndex] = useState(null);
  // const [resizeStart, setResizeStart] = useState(null);
  // const [buttonPositions, setButtonPositions] = useState({
  //   addSignature: { x: 20, y: 20 },
  //   addDate: { x: 140, y: 20 },
  // });
  // const [draggingButton, setDraggingButton] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib) return; 
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: 100,
  //     height: 20,
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleSignatureClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const fileInput = document.createElement('input');
  //   fileInput.type = 'file';
  //   fileInput.accept = 'image/*';
  //   fileInput.onchange = (e) => {
  //     const file = e.target.files[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const img = new Image();
  //         img.src = e.target.result;
  //         img.onload = () => {
  //           const newSignature = {
  //             left: `${x}px`,
  //             top: `${y}px`,
  //             width: img.width / 4, // Adjust size as needed
  //             height: img.height / 4, // Adjust size as needed
  //             src: img.src,
  //           };
  //           setSignatures([...signatures, newSignature]);
  //         };
  //       };
  //       reader.readAsDataURL(file);
  //     }
  //   };
  //   fileInput.click();
  // };

  // const handleDateClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const dateInput = document.createElement('input');
  //   dateInput.type = 'date';
  //   dateInput.onchange = (e) => {
  //     const newDate = {
  //       left: `${x}px`,
  //       top: `${y}px`,
  //       value: e.target.value,
  //     };
  //     setDates([...dates, newDate]);
  //   };
  //   dateInput.style.position = 'absolute';
  //   dateInput.style.left = `${event.clientX}px`;
  //   dateInput.style.top = `${event.clientY}px`;
  //   document.body.appendChild(dateInput);
  //   dateInput.click();
  //   dateInput.onblur = () => {
  //     document.body.removeChild(dateInput);
  //   };
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleSignatureDelete = (index) => {
  //   const updatedSignatures = signatures.filter((_, i) => i !== index);
  //   setSignatures(updatedSignatures);
  // };

  // const handleDateDelete = (index) => {
  //   const updatedDates = dates.filter((_, i) => i !== index);
  //   setDates(updatedDates);
  // };

  // const handleMouseDown = (index, event) => {
  //   setResizingIndex(index);
  //   setResizeStart({
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     startWidth: annotations[index].width,
  //     startHeight: annotations[index].height,
  //   });
  //   event.stopPropagation();
  // };

  // const handleMouseMove = (event) => {
  //   if (resizingIndex !== null && resizeStart) {
  //     const dx = event.clientX - resizeStart.startX;
  //     const dy = event.clientY - resizeStart.startY;
  //     const newWidth = resizeStart.startWidth + dx;
  //     const newHeight = resizeStart.startHeight + dy;

  //     const updatedAnnotations = annotations.map((annotation, i) =>
  //       i === resizingIndex
  //         ? { ...annotation, width: newWidth, height: newHeight }
  //         : annotation
  //     );
  //     setAnnotations(updatedAnnotations);
  //   } else if (draggingButton) {
  //     const newPositions = { ...buttonPositions };
  //     newPositions[draggingButton].x = event.clientX - containerRef.current.getBoundingClientRect().left - 50;
  //     newPositions[draggingButton].y = event.clientY - containerRef.current.getBoundingClientRect().top - 20;
  //     setButtonPositions(newPositions);
  //   }
  // };

  // const handleMouseUp = () => {
  //   setResizingIndex(null);
  //   setResizeStart(null);
  //   setDraggingButton(null);
  // };

  // const handleDragStart = (button) => {
  //   setDraggingButton(button);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  // });

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     <button
  //       onClick={handleSignatureClick}
  //       onMouseDown={() => handleDragStart('addSignature')}
  //       className="absolute p-2 bg-blue-500 text-white rounded"
  //       style={{
  //         left: `${buttonPositions.addSignature.x}px`,
  //         top: `${buttonPositions.addSignature.y}px`,
  //         cursor: 'move',
  //       }}
  //     >
  //       Add Signature
  //     </button>
  //     <button
  //       onClick={handleDateClick}
  //       onMouseDown={() => handleDragStart('addDate')}
  //       className="absolute p-2 bg-green-500 text-white rounded"
  //       style={{
  //         left: `${buttonPositions.addDate.x}px`,
  //         top: `${buttonPositions.addDate.y}px`,
  //         cursor: 'move',
  //       }}
  //     >
  //       Add Date
  //     </button>
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         <textarea
  //           className="bg-transparent border border-red-500 resize-none"
  //           style={{ width: `${annotation.width}px`, height: `${annotation.height}px` }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //         <div
  //           className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
  //           onMouseDown={(event) => handleMouseDown(index, event)}
  //         ></div>
  //       </div>
  //     ))}
  //     {signatures.map((signature, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{
  //           position: 'absolute',
  //           left: signature.left,
  //           top: signature.top,
  //           width: `${signature.width}px`,
  //           height: `${signature.height}px`,
  //         }}
  //         onMouseEnter={() => setHoveredSignatureIndex(index)}
  //         onMouseLeave={() => setHoveredSignatureIndex(null)}
  //       >
  //         <img
  //           src={signature.src}
  //           alt="Signature"
  //           style={{
  //             width: '100%',
  //             height: '100%',
  //           }}
  //         />
  //         {hoveredSignatureIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleSignatureDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //       </div>
  //     ))}
  //     {dates.map((date, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{
  //           position: 'absolute',
  //           left: date.left,
  //           top: date.top,
  //           backgroundColor: 'white',
  //           padding: '2px',
  //           border: '1px solid black',
  //         }}
  //         onMouseEnter={() => setHoveredDateIndex(index)}
  //         onMouseLeave={() => setHoveredDateIndex(null)}
  //       >
  //         {date.value}
  //         {hoveredDateIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleDateDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //       </div>
  //     ))}
  //   </div>
  // );




  // add drag
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [signatures, setSignatures] = useState([]);
  // const [dates, setDates] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  // const [resizingIndex, setResizingIndex] = useState(null);
  // const [resizeStart, setResizeStart] = useState(null);
  // const [buttonPositions, setButtonPositions] = useState({
  //   addSignature: { x: 20, y: 20 },
  //   addDate: { x: 140, y: 20 },
  // });
  // const [draggingButton, setDraggingButton] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib)return;
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: 100,
  //     height: 20,
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleSignatureClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const fileInput = document.createElement('input');
  //   fileInput.type = 'file';
  //   fileInput.accept = 'image/*';
  //   fileInput.onchange = (e) => {
  //     const file = e.target.files[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const img = new Image();
  //         img.src = e.target.result;
  //         img.onload = () => {
  //           const newSignature = {
  //             left: `${x}px`,
  //             top: `${y}px`,
  //             width: img.width / 4, // Adjust size as needed
  //             height: img.height / 4, // Adjust size as needed
  //             src: img.src,
  //           };
  //           setSignatures([...signatures, newSignature]);
  //         };
  //       };
  //       reader.readAsDataURL(file);
  //     }
  //   };
  //   fileInput.click();
  // };

  // const handleDateClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const dateInput = document.createElement('input');
  //   dateInput.type = 'date';
  //   dateInput.onchange = (e) => {
  //     const newDate = {
  //       left: `${x}px`,
  //       top: `${y}px`,
  //       value: e.target.value,
  //     };
  //     setDates([...dates, newDate]);
  //   };
  //   dateInput.style.position = 'absolute';
  //   dateInput.style.left = `${event.clientX}px`;
  //   dateInput.style.top = `${event.clientY}px`;
  //   document.body.appendChild(dateInput);
  //   dateInput.click();
  //   dateInput.onblur = () => {
  //     document.body.removeChild(dateInput);
  //   };
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleMouseDown = (index, event) => {
  //   setResizingIndex(index);
  //   setResizeStart({
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     startWidth: annotations[index].width,
  //     startHeight: annotations[index].height,
  //   });
  //   event.stopPropagation();
  // };

  // const handleMouseMove = (event) => {
  //   if (resizingIndex !== null && resizeStart) {
  //     const dx = event.clientX - resizeStart.startX;
  //     const dy = event.clientY - resizeStart.startY;
  //     const newWidth = resizeStart.startWidth + dx;
  //     const newHeight = resizeStart.startHeight + dy;

  //     const updatedAnnotations = annotations.map((annotation, i) =>
  //       i === resizingIndex
  //         ? { ...annotation, width: newWidth, height: newHeight }
  //         : annotation
  //     );
  //     setAnnotations(updatedAnnotations);
  //   } else if (draggingButton) {
  //     const newPositions = { ...buttonPositions };
  //     newPositions[draggingButton].x = event.clientX - containerRef.current.getBoundingClientRect().left - 50;
  //     newPositions[draggingButton].y = event.clientY - containerRef.current.getBoundingClientRect().top - 20;
  //     setButtonPositions(newPositions);
  //   }
  // };

  // const handleMouseUp = () => {
  //   setResizingIndex(null);
  //   setResizeStart(null);
  //   setDraggingButton(null);
  // };

  // const handleDragStart = (button) => {
  //   setDraggingButton(button);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  // });

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     <button
  //       onClick={handleSignatureClick}
  //       onMouseDown={() => handleDragStart('addSignature')}
  //       className="absolute p-2 bg-blue-500 text-white rounded"
  //       style={{
  //         left: `${buttonPositions.addSignature.x}px`,
  //         top: `${buttonPositions.addSignature.y}px`,
  //         cursor: 'move',
  //       }}
  //     >
  //       Add Signature
  //     </button>
  //     <button
  //       onClick={handleDateClick}
  //       onMouseDown={() => handleDragStart('addDate')}
  //       className="absolute p-2 bg-green-500 text-white rounded"
  //       style={{
  //         left: `${buttonPositions.addDate.x}px`,
  //         top: `${buttonPositions.addDate.y}px`,
  //         cursor: 'move',
  //       }}
  //     >
  //       Add Date
  //     </button>
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         <textarea
  //           className="bg-transparent border border-red-500 resize-none"
  //           style={{ width: `${annotation.width}px`, height: `${annotation.height}px` }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //         <div
  //           className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
  //           onMouseDown={(event) => handleMouseDown(index, event)}
  //         ></div>
  //       </div>
  //     ))}
  //     {signatures.map((signature, index) => (
  //       <img
  //         key={index}
  //         src={signature.src}
  //         alt="Signature"
  //         style={{
  //           position: 'absolute',
  //           left: signature.left,
  //           top: signature.top,
  //           width: `${signature.width}px`,
  //           height: `${signature.height}px`,
  //         }}
  //       />
  //     ))}
  //     {dates.map((date, index) => (
  //       <div
  //         key={index}
  //         style={{
  //           position: 'absolute',
  //           left: date.left,
  //           top: date.top,
  //           backgroundColor: 'white',
  //           padding: '2px',
  //           border: '1px solid black',
  //         }}
  //       >
  //         {date.value}
  //       </div>
  //     ))}
  //   </div>
  // );




  // add date
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [signatures, setSignatures] = useState([]);
  // const [dates, setDates] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  // const [resizingIndex, setResizingIndex] = useState(null);
  // const [resizeStart, setResizeStart] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib)return
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: 100,
  //     height: 20,
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleSignatureClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const fileInput = document.createElement('input');
  //   fileInput.type = 'file';
  //   fileInput.accept = 'image/*';
  //   fileInput.onchange = (e) => {
  //     const file = e.target.files[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const img = new Image();
  //         img.src = e.target.result;
  //         img.onload = () => {
  //           const newSignature = {
  //             left: `${x}px`,
  //             top: `${y}px`,
  //             width: img.width / 4, // Adjust size as needed
  //             height: img.height / 4, // Adjust size as needed
  //             src: img.src,
  //           };
  //           setSignatures([...signatures, newSignature]);
  //         };
  //       };
  //       reader.readAsDataURL(file);
  //     }
  //   };
  //   fileInput.click();
  // };

  // const handleDateClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const dateInput = document.createElement('input');
  //   dateInput.type = 'date';
  //   dateInput.onchange = (e) => {
  //     const newDate = {
  //       left: `${x}px`,
  //       top: `${y}px`,
  //       value: e.target.value,
  //     };
  //     setDates([...dates, newDate]);
  //   };
  //   dateInput.style.position = 'absolute';
  //   dateInput.style.left = `${event.clientX}px`;
  //   dateInput.style.top = `${event.clientY}px`;
  //   document.body.appendChild(dateInput);
  //   dateInput.click();
  //   dateInput.onblur = () => {
  //     document.body.removeChild(dateInput);
  //   };
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleMouseDown = (index, event) => {
  //   setResizingIndex(index);
  //   setResizeStart({
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     startWidth: annotations[index].width,
  //     startHeight: annotations[index].height,
  //   });
  //   event.stopPropagation();
  // };

  // const handleMouseMove = (event) => {
  //   if (resizingIndex !== null && resizeStart) {
  //     const dx = event.clientX - resizeStart.startX;
  //     const dy = event.clientY - resizeStart.startY;
  //     const newWidth = resizeStart.startWidth + dx;
  //     const newHeight = resizeStart.startHeight + dy;

  //     const updatedAnnotations = annotations.map((annotation, i) =>
  //       i === resizingIndex
  //         ? { ...annotation, width: newWidth, height: newHeight }
  //         : annotation
  //     );
  //     setAnnotations(updatedAnnotations);
  //   }
  // };

  // const handleMouseUp = () => {
  //   setResizingIndex(null);
  //   setResizeStart(null);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  // });

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     <button
  //       onClick={handleSignatureClick}
  //       className="absolute top-0 left-0 mt-2 ml-2 p-2 bg-blue-500 text-white rounded"
  //     >
  //       Add Signature
  //     </button>
  //     <button
  //       onClick={handleDateClick}
  //       className="absolute top-0 left-20 mt-2 ml-2 p-2 bg-green-500 text-white rounded"
  //     >
  //       Add Date
  //     </button>
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         <textarea
  //           className="bg-transparent border border-red-500 resize-none"
  //           style={{ width: `${annotation.width}px`, height: `${annotation.height}px` }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //         <div
  //           className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
  //           onMouseDown={(event) => handleMouseDown(index, event)}
  //         ></div>
  //       </div>
  //     ))}
  //     {signatures.map((signature, index) => (
  //       <img
  //         key={index}
  //         src={signature.src}
  //         alt="Signature"
  //         style={{
  //           position: 'absolute',
  //           left: signature.left,
  //           top: signature.top,
  //           width: `${signature.width}px`,
  //           height: `${signature.height}px`,
  //         }}
  //       />
  //     ))}
  //     {dates.map((date, index) => (
  //       <div
  //         key={index}
  //         style={{
  //           position: 'absolute',
  //           left: date.left,
  //           top: date.top,
  //           backgroundColor: 'white',
  //           padding: '2px',
  //           border: '1px solid black',
  //         }}
  //       >
  //         {date.value}
  //       </div>
  //     ))}
  //   </div>
  // );



  // add sign
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [signatures, setSignatures] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  // const [resizingIndex, setResizingIndex] = useState(null);
  // const [resizeStart, setResizeStart] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib)return;
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: 100,
  //     height: 20,
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleSignatureClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const fileInput = document.createElement('input');
  //   fileInput.type = 'file';
  //   fileInput.accept = 'image/*';
  //   fileInput.onchange = (e) => {
  //     const file = e.target.files[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const img = new Image();
  //         img.src = e.target.result;
  //         img.onload = () => {
  //           const newSignature = {
  //             left: `${x}px`,
  //             top: `${y}px`,
  //             width: img.width / 4, // Adjust size as needed
  //             height: img.height / 4, // Adjust size as needed
  //             src: img.src,
  //           };
  //           setSignatures([...signatures, newSignature]);
  //         };
  //       };
  //       reader.readAsDataURL(file);
  //     }
  //   };
  //   fileInput.click();
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleMouseDown = (index, event) => {
  //   setResizingIndex(index);
  //   setResizeStart({
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     startWidth: annotations[index].width,
  //     startHeight: annotations[index].height,
  //   });
  //   event.stopPropagation();
  // };

  // const handleMouseMove = (event) => {
  //   if (resizingIndex !== null && resizeStart) {
  //     const dx = event.clientX - resizeStart.startX;
  //     const dy = event.clientY - resizeStart.startY;
  //     const newWidth = resizeStart.startWidth + dx;
  //     const newHeight = resizeStart.startHeight + dy;

  //     const updatedAnnotations = annotations.map((annotation, i) =>
  //       i === resizingIndex
  //         ? { ...annotation, width: newWidth, height: newHeight }
  //         : annotation
  //     );
  //     setAnnotations(updatedAnnotations);
  //   }
  // };

  // const handleMouseUp = () => {
  //   setResizingIndex(null);
  //   setResizeStart(null);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  // });

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     <button
  //       onClick={handleSignatureClick}
  //       className="absolute top-0 left-0 mt-2 ml-2 p-2 bg-blue-500 text-white rounded"
  //     >
  //       Add Signature
  //     </button>
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         <textarea
  //           className="bg-transparent border border-red-500 resize-none"
  //           style={{ width: `${annotation.width}px`, height: `${annotation.height}px` }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //         <div
  //           className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
  //           onMouseDown={(event) => handleMouseDown(index, event)}
  //         ></div>
  //       </div>
  //     ))}
  //     {signatures.map((signature, index) => (
  //       <img
  //         key={index}
  //         src={signature.src}
  //         alt="Signature"
  //         style={{
  //           position: 'absolute',
  //           left: signature.left,
  //           top: signature.top,
  //           width: `${signature.width}px`,
  //           height: `${signature.height}px`,
  //         }}
  //       />
  //     ))}
  //   </div>
  // );



  // resize area
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);
  // const [resizingIndex, setResizingIndex] = useState(null);
  // const [resizeStart, setResizeStart] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib) return;
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: 150,
  //     height: 40,
  //     fontSize: 36,
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleMouseDown = (index, event) => {
  //   setResizingIndex(index);
  //   setResizeStart({
  //     startX: event.clientX,
  //     startY: event.clientY,
  //     startWidth: annotations[index].width,
  //     startHeight: annotations[index].height,
  //   });
  //   event.stopPropagation();
  // };

  // const handleMouseMove = (event) => {
  //   if (resizingIndex !== null && resizeStart) {
  //     const dx = event.clientX - resizeStart.startX;
  //     const dy = event.clientY - resizeStart.startY;
  //     const newWidth = resizeStart.startWidth + dx;
  //     const newHeight = resizeStart.startHeight + dy;

  //     const updatedAnnotations = annotations.map((annotation, i) =>
  //       i === resizingIndex
  //         ? { ...annotation, width: newWidth, height: 1.2*newHeight, fontSize: newHeight }
  //         : annotation
  //     );
  //     setAnnotations(updatedAnnotations);
  //   }
  // };

  // const handleMouseUp = () => {
  //   setResizingIndex(null);
  //   setResizeStart(null);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // useEffect(() => {
  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   return () => {
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  // });

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         {/* <textarea */}
  //         <input
  //           className="bg-transparent border border-red-500 resize-none"
  //           style={{ width: `${annotation.width}px`, height: `${annotation.height}px`, fontSize: `${annotation.fontSize}px` }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 top-0 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //         <div
  //           className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
  //           onMouseDown={(event) => handleMouseDown(index, event)}
  //         ></div>
  //       </div>
  //     ))}
  //   </div>
  // );


  // del text anno
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);
  // const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState(null);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if(!pdfjsLib) return;
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: '100px',
  //     height: '20px',
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // const handleAnnotationDelete = (index) => {
  //   const updatedAnnotations = annotations.filter((_, i) => i !== index);
  //   setAnnotations(updatedAnnotations);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     {annotations.map((annotation, index) => (
  //       <div
  //         key={index}
  //         className="group"
  //         style={{ position: 'absolute', left: annotation.left, top: annotation.top }}
  //         onMouseEnter={() => setHoveredAnnotationIndex(index)}
  //         onMouseLeave={() => setHoveredAnnotationIndex(null)}
  //       >
  //         <textarea
  //           className="bg-transparent border border-red-500"
  //           style={{ width: annotation.width, height: annotation.height }}
  //           value={annotation.value}
  //           onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //         />
  //         {hoveredAnnotationIndex === index && (
  //           <div className="absolute right-0 -top-9 mt-1 mr-1 p-1 bg-white border border-gray-300 rounded shadow-lg">
  //             <button
  //               onClick={() => handleAnnotationDelete(index)}
  //               className="text-xs text-red-500 hover:text-red-700"
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         )}
  //       </div>
  //     ))}
  //   </div>
  // );


  // text Annot
  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     if (!pdfjsLib) return;
  //     const pdf = await pdfjsLib.getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [pdfjsLib]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: "100px",
  //     height: "20px",
  //     value: "",
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

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

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     {annotations.map((annotation, index) => (
  //       <textarea
  //         key={index}
  //         className="absolute bg-transparent border border-red-500"
  //         style={{
  //           left: annotation.left,
  //           top: annotation.top,
  //           width: annotation.width,
  //           height: annotation.height,
  //         }}
  //         value={annotation.value}
  //         onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //       />
  //     ))}
  //   </div>
  // );

  // const renderPage = useCallback(
  //   (pageNum, pdf = pdfRef) => {
  //     pdf &&
  //       pdf.getPage(pageNum).then(function (page) {
  //         const viewport = page.getViewport({ scale: 1.5 });
  //         const canvas = canvasRef.current;
  //         canvas.height = viewport.height;
  //         canvas.width = viewport.width;
  //         const renderContext = {
  //           canvasContext: canvas.getContext("2d"),
  //           viewport: viewport,
  //         };
  //         page.render(renderContext);
  //       });
  //   },
  //   [pdfRef]
  // );

  // useEffect(() => {
  //   renderPage(currentPage, pdfRef);
  // }, [pdfRef, currentPage, renderPage]);

  // useEffect(() => {
  //   // if (!pdfjsLib) return;
  //   const loadingTask = pdfjsLib?.getDocument(url);
  //   loadingTask?.promise.then(
  //     (loadedPdf) => {
  //       console.log("task", loadedPdf);
  //       setPdfRef(loadedPdf);
  //     },
  //     function (reason) {
  //       console.error(reason);
  //     }
  //   );
  // }, [url, pdfjsLib]);

  // drag and drop
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfjsLib) return;
      const loadingTask = pdfjsLib.getDocument(url);
      // const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;

      // Render the first three pages
      // const pages = [1, 2, 3];
      const pages = [1];
      pages.forEach(async (pageNumber, index) => {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas: CanvasHTMLAttributes<React.ReactNode> =
          //  { height: string; width: string }
          canvasRefs[index].current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Position the button in the center of the canvas
        const button = buttonRefs[index].current;
        button.style.top = `${
          canvas.offsetTop + canvas.height / 2 - button.offsetHeight / 2
        }px`;
        button.style.left = `${
          canvas.offsetLeft + canvas.width / 2 - button.offsetWidth / 2
        }px`;

        let offsetX, offsetY;
        let isDragging = false;
        let startX, startY;

        const onMouseDown = (event) => {
          isDragging = false;

          startX = event.clientX;
          startY = event.clientY;
          offsetX = event.clientX - button.getBoundingClientRect().left;
          offsetY = event.clientY - button.getBoundingClientRect().top;
          console.log(
            "oMD",
            canvas,
            canvas.offsetLeft,
            canvas.offsetTop,
            canvas.getBoundingClientRect()
          );

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (event) => {
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            isDragging = true;
            // button.style.left = `${event.clientX - button.offsetWidth / 2}px`;
            // button.style.top = `${event.clientY - button.offsetHeight / 2}px`;
            button.style.left = `${
              event.clientX - canvas.getBoundingClientRect().left - offsetX
            }px`;

            button.style.top = `${
              event.clientY - canvas.getBoundingClientRect().top - offsetY
            }px`;

            if (
              canvas.getBoundingClientRect().left >
              button.getBoundingClientRect().left
            )
              // button.style.left = `${canvas.getBoundingClientRect().left}px`;
              button.style.left = `0px`;

            if (
              canvas.getBoundingClientRect().top >
              button.getBoundingClientRect().top
            ) {
              console.log(
                "top",
                `${canvas.getBoundingClientRect().top}px`,
                `${button.getBoundingClientRect().top}px`
              );
              // button.style.top = `${canvas.getBoundingClientRect().top}px`;
              button.style.top = `${0}px`;
            }
          }
          // console.log("oMM", event.clientX, event.clientY, event.layerX, event.layerY, event.offsetX, event.offsetY, event.pageX, event.pageY, event.screenX, event.screenY, event.x, event.y);

          // button.style.left = `${event.clientX - offsetX}px`;
          // button.style.top = `${event.clientY - offsetY}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        button.addEventListener("mousedown", onMouseDown);
        button.addEventListener("click", (event) => {
          if (!isDragging) {
            alert(`Button on page ${index + 1} clicked`);
          }
        });

        //   canvas.addEventListener('click', function(event) {
        //     const po = document.getElementById('pink')
        //     const rect = canvas.getBoundingClientRect();
        //     const x = event.clientX - rect.left;
        //     const y = event.clientY - rect.top;

        //     const input = document.createElement('textarea');  // Or use 'input' for single-line text
        //     input.className = 'text-annotation';
        //     input.style.left = `${x}px`;
        //     input.style.top = `${y}px`;
        //     input.style.width = '100px';  // You can adjust the size as needed
        //     input.style.height = '20px';  // You can adjust the size as needed

        //     // pdfContainer.appendChild(input);
        //     po.appendChild(input);

        //     input.focus();  // Focus the input immediately
        // });
      });
    };

    loadPDF();
  }, [pdfjsLib]);

  const nextPage = () =>
    pdfRef && currentPage < pdfRef.numPages && setCurrentPage(currentPage + 1);

  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div style={{ position: "relative" }}>
      {canvasRefs.map((ref, index) => (
        <div
          id="pink"
          key={index}
          style={{ position: "relative", margin: "10px 0" }}
        >
          <canvas ref={ref} />
          <button
            ref={buttonRefs[index]}
            style={{
              position: "absolute",
              // transform: "translate(-50%, -50%)",
              padding: "10px 20px",
              backgroundColor: "blue",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Drag Me
          </button>
        </div>
      ))}
    </div>

  //text anon

  // const canvasRef = useRef(null);
  // const containerRef = useRef(null);
  // const [annotations, setAnnotations] = useState([]);

  // useEffect(() => {
  //   const loadPDF = async () => {
  //     const pdf = await getDocument(url).promise;
  //     const page = await pdf.getPage(1);
  //     const viewport = page.getViewport({ scale: 1.5 });

  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext('2d');
  //     canvas.height = viewport.height;
  //     canvas.width = viewport.width;

  //     const renderContext = {
  //       canvasContext: context,
  //       viewport,
  //     };
  //     await page.render(renderContext).promise;
  //   };
  //   loadPDF();
  // }, [url]);

  // const handleCanvasClick = (event) => {
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;

  //   const newAnnotation = {
  //     left: `${x}px`,
  //     top: `${y}px`,
  //     width: '100px',
  //     height: '20px',
  //     value: '',
  //   };
  //   setAnnotations([...annotations, newAnnotation]);
  // };

  // const handleAnnotationChange = (index, value) => {
  //   const updatedAnnotations = annotations.map((annotation, i) =>
  //     i === index ? { ...annotation, value } : annotation
  //   );
  //   setAnnotations(updatedAnnotations);
  // };

  // useEffect(() => {
  //   const savedAnnotations = JSON.parse(localStorage.getItem('annotations') || '[]');
  //   setAnnotations(savedAnnotations);
  // }, []);

  // useEffect(() => {
  //   const saveAnnotations = () => {
  //     localStorage.setItem('annotations', JSON.stringify(annotations));
  //   };
  //   window.addEventListener('beforeunload', saveAnnotations);
  //   return () => window.removeEventListener('beforeunload', saveAnnotations);
  // }, [annotations]);

  // return (
  //   <div ref={containerRef} className="relative">
  //     <canvas ref={canvasRef} onClick={handleCanvasClick} className="border" />
  //     {annotations.map((annotation, index) => (
  //       <textarea
  //         key={index}
  //         className="absolute bg-transparent border border-red-500"
  //         style={{ left: annotation.left, top: annotation.top, width: annotation.width, height: annotation.height }}
  //         value={annotation.value}
  //         onChange={(e) => handleAnnotationChange(index, e.target.value)}
  //       />
  //     ))}
  //   </div>
  // );

  //  idk at this point

  // <div style={{ position: "relative" }}>
  //   {canvasRefs.map((ref, index) => (
  //     <div key={index} style={{ position: "relative", margin: "10px 0" }}>
  //       <canvas ref={ref} />
  //       <button
  //         ref={buttonRefs[index]}
  //         style={{
  //           position: "absolute",
  //           transform: "translate(-50%, -50%)",
  //           padding: "10px 20px",
  //           backgroundColor: "blue",
  //           color: "white",
  //           border: "none",
  //           borderRadius: "5px",
  //           cursor: "pointer",
  //         }}
  //         onClick={() => alert(`Button on page ${index + 1} clicked`)}
  //       >
  //         Click Me
  //       </button>
  //     </div>
  //   ))}
  // </div>

  // <div className="">
  //   <button onClick={prevPage}>prev</button>
  //   <button onClick={nextPage}>next</button>
  //   <canvas ref={canvasRef}></canvas>
  // </div>
  // );
}

// // import { PDFDocument } from "pdf-lib";
// import { useEffect, useState } from "react";
// import * as lib from "pdfjs-dist";
// import { Viewport } from "@radix-ui/react-select";

// //   import * as PDFJS from "pdfjs-dist/build/pdf";
// // import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
// import * as PDFJS from "pdfjs-dist/build/pdf.mjs";
// import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs";

// window.PDFJS = PDFJS;

// export default function Hitt() {
//   const [r, setR] = useState(false);

//   // export default function PDFViewer({ pdfFile }) {
//   // PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

//   // const getPDFDoc = useCallback(async () => {
//   //   const doc = await PDFJS.getDocument(pdfFile);
//   //   doc.promise.then(
//   //     (loadedPdf) => {
//   //       setPdfRef(loadedPdf);
//   //     },
//   //     function (reason) {
//   //       console.error(reason);
//   //     }
//   //   );
//   // }, []);

//   // useEffect(() => {
//   //   getPDFDoc();
//   // }, [getPDFDoc]);

//   // async function loadPdf() {
//   //   const url = "/Version_3_Lucky.pdf";
//   //   const bytes = await fetch(url).then((res) => res.arrayBuffer());

//   //   const doc = await PDFDocument.load(bytes);
//   //   const viewerPrefs = doc.catalog.getOrCreateViewerPreferences();
//   //   console.log("vp", viewerPrefs);
//   //   console.log("doc", doc);
//   //   viewerPrefs.setHideToolbar(true);
//   //   viewerPrefs.setHideMenubar(true);
//   //   viewerPrefs.setHideWindowUI(true);
//   //   viewerPrefs.setFitWindow(true);
//   //   viewerPrefs.setCenterWindow(true);
//   //   viewerPrefs.setDisplayDocTitle(true);
//   //   const pb = await doc.save();
//   //   const uri = await doc.saveAsBase64({ dataUri: true });
//   //   document.getElementById("pp").src = uri;
//   // }

//   // const qw = async () => {
//   //   const d = document.getElementById("pdfv");
//   //   if(!d) return;
//   //   const bytes = await fetch("/Version_3_Lucky.pdf").then((res) =>
//   //     res.arrayBuffer()
//   //   );
//   //   // const doc = await lib.getDocument({ data: bytes }).promise;
//   //   const doc = await pdfjsLib.getDocument({ data: bytes }).promise;

//   // //   // renderz();
//   //   console.log("yes",d,doc);
//   //   // d.innerHTML = "";

//   //   doc.getPage(0).then(page => {
//   //     const {width, height} = page.getViewport({scale:1.5})
//   //     const canvas = document.createElement("canvas")
//   //     canvas.width = width
//   //     canvas.height = height

//   //     d.appendChild(canvas)

//   //     const renderContext = {
//   //       canvasContext: canvas.getContext("2d"),
//   //       Viewport: page.getViewport({scale: 1.5})
//   //     }

//   //     page.render(renderContext).promise.then(() =>{
//   //       console.log('PAZE')
//   //     })
//   //   })
//   // };
//   // qw();

//   // loadPdf();

//   useEffect(() => {
//     setR(true);
//   }, []);

//   if (!r) return;

//   return (
//     <>
//       {/* <div id="qw" className="h-[800px] w-[800px]"> */}
//       {/* </div> */}
//       {/* <img id="ii" alt="" /> */}
//       <p>h</p>
//       <div id="pdfv"></div>
//       {/* <iframe
//         id="pp"
//         onClick={() => {
//           console.log("aa");
//         }}
//         className="h-[800px] w-[800px]"
//       ></iframe> */}
//     </>
//   );
// }

//  now add text inserter in

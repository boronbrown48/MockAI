import { Download, RemoveRedEye } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid2,
  IconButton,
  Stack,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tesseract from 'tesseract.js';
import React, { useEffect, useMemo, useState } from "react";
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs`;

function FileConverter({ pdfUrl, fileName }) {
  const myRef = React.createRef();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [numOfPages, setNumOfPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (imageUrls.length > 0) {
      setLoading(false);
    }
  }, [imageUrls]);

  const handleClickOpen = (url, index) => {
    setSelectedImage({ url, index });
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOpen(false);
  };

  const handleOcr = (imageUrl) => {
    if (!imageUrl) return; // Check if the image URL is provided
  
    setLoading(true);
    
    Tesseract.recognize(
      imageUrl, // Use the passed image URL
      'eng',
      {
        logger: (m) => console.log(m), // Optional: for logging progress
      }
    ).then(({ data: { text } }) => {
      setText(text);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };  

  const UrlUploader = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = atob(e.target.result.replace(/.*base64,/, ""));
      renderPage(data);
    };
    reader.readAsDataURL(blob);
  };

  useMemo(() => {
    UrlUploader(pdfUrl);
  }, [pdfUrl]);

  const renderPage = async (data) => {
    setLoading(true);
    const canvas = document.createElement("canvas");
    const pdf = await getDocument({ data }).promise;

    // Calculate total height for merged image
    let totalHeight = 0;
    const imagesList = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      // Set canvas width and height for individual pages
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
      }).promise;

      // Store individual images in a list
      let img = canvas.toDataURL("image/png");
      imagesList.push(img);
      totalHeight += viewport.height; // Add to total height for merging
    }

    // Create a new canvas for merging images
    const mergeCanvas = document.createElement("canvas");
    mergeCanvas.width = canvas.width;
    mergeCanvas.height = totalHeight;
    const mergeCtx = mergeCanvas.getContext("2d");

    // Draw each individual image onto the merged canvas
    let currentHeight = 0;
    for (const img of imagesList) {
      const image = new Image();
      image.src = img;
      await new Promise((resolve) => {
        image.onload = () => {
          mergeCtx.drawImage(image, 0, currentHeight);
          currentHeight += image.height; // Update current height
          resolve();
        };
      });
    }

    // Convert the merged canvas to data URL
    const mergedImageUrl = mergeCanvas.toDataURL("image/png");
    setNumOfPages(1); // Set to 1 since now there's only one merged image
    setImageUrls([mergedImageUrl]); // Set the merged image URL
    setLoading(false);

    handleOcr(mergedImageUrl)
  };

  useEffect(() => {
    if (myRef.current) {
      myRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [imageUrls]);

  const downloadImage = (url, index) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    handleClose();
  };

  return (
    <Box sx={{ my: 4, textAlign: "center" }} ref={myRef}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {imageUrls.length > 0 && (
            <>
              <h4>Converted Image - {numOfPages}</h4>
              <Grid2 container spacing={3}>
                {imageUrls.map((url, index) => (
                  <Grid2 item xs={12} key={index}>
                    <Box sx={{ width: "100%", height: "250px", position: "relative" }}>
                      <img
                        src={url}
                        alt={`Merged Image`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ position: "absolute", top: 2, right: 2 }}
                      >
                        <IconButton onClick={() => handleClickOpen(url, index)}>
                          <RemoveRedEye />
                        </IconButton>
                        <IconButton onClick={() => downloadImage(url, index)}>
                          <Download />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Grid2>
                ))}
              </Grid2>
            </>
          )}
        </>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="scroll-dialog-title">Preview</DialogTitle>
        <DialogContent dividers>
          <img
            src={selectedImage?.url}
            alt={selectedImage?.url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => downloadImage(selectedImage.url, selectedImage.index)}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileConverter;

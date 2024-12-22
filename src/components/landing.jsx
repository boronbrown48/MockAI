import React, { useState, useCallback, useRef, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Button,
  Container,
  Typography,
  Box,
  Toolbar,
  AppBar,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  useMediaQuery,
  Dialog,
  DialogContent,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import pdfToText from './PdfOcr'; // Create a URL for the file
import { extractTextFromDocx } from "./DocxExtractor";
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useTheme } from '@mui/material/styles';
import CandidateFormDialog from './SessionDialog';
import LandingContent from './LandingContent';
import { BASE_URL_SETTING } from './../setting';

export default function Landing({ handleAccessChat, setIsAuthenticated }) {
  const [loading, setLoading] = useState(false);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [jobDescFiles, setJobDescFiles] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [jobDescText, setJobDescText] = useState("");
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingJobDesc, setIsDraggingJobDesc] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(""); // Loading message
  const [entries, setEntries] = useState([]);

  const resumeInputRef = useRef(null);
  const jobDescInputRef = useRef(null);

  const navigate = useNavigate();

  const BASE_URL = BASE_URL_SETTING;


  const handleSubmit = async (event) => {
    event.preventDefault();
    localStorage.setItem('resumeData', resumeText);
    localStorage.setItem('jdData', jobDescText);

    setIsAuthenticated(true);
    // Redirect to login page or another page
    handleAccessChat();
    navigate('/chat');
  };

  const deleteSessionData = async (sessionId) => {
    const requestData = {
      client_id: localStorage.getItem('client_id'),
      session_id: sessionId,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/delete_session?client_id=${requestData.client_id}&session_id=${requestData.session_id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if the response is successful
      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData)
      } else {
        const data = await response.json();
        console.log(data)
      }
    } catch (err) {
      console.log('Network error occurred');
    }
  }

  const getSessionsList = async (clientId) => {
    try {
      // Make a GET request to the /get_sessions_list endpoint with the client_id as a query parameter
      const response = await fetch(`${BASE_URL}/get_sessions_list?client_id=${clientId}`);

      // Check if the response is OK (status code 200)
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const dataText = await response.text();
      console.log("Raw response data:", dataText);

      if (dataText != "") {
        const dataJson = JSON.parse(dataText.trim());
        console.log("Sessions Data: ", dataJson)
        console.log(typeof dataJson);
        console.log(Array.isArray(JSON.parse(dataJson)));
        setEntries(JSON.parse(dataJson));
      }

    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    if (clientId) {
      getSessionsList(clientId);
    }
  }, []); // Empty dependency array ensures this only runs once when the component mounts.


  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No access token found.'); // Handle case where token is not available
      }

      const response = await fetch(BASE_URL + '/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
        },
        body: JSON.stringify({ token }), // Pass the token in the request body if required
      });

      if (!response.ok) {
        throw new Error('Logout failed.'); // Handle HTTP error
      }

      // const data = await response.json();

      localStorage.clear(); // Clear the Local storage

      setIsAuthenticated(false);
      // Redirect to login page or another page
      navigate('/');

    } catch (error) {
      console.error('Error during logout:', error.message);
      // Handle logout error (e.g., show a notification)
    }
  };

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: '#FFFFFF',
        paper: '#FFFFFF',
      },
      primary: {
        main: '#000000',
      },
      secondary: {
        main: '#FFFFFF'
      }
    },
  });

  const handleDrag = (e, setDragging) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragging(true);
    } else if (e.type === "dragleave") {
      setDragging(false);
    }
  };

  const handleClear = (e, type) => {
    e.stopPropagation(); // Prevent triggering the file dialog
    if (type === "Resume") {
      setResumeFiles([]);
      setResumeText("");
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    } else {
      setJobDescFiles([]);
      setJobDescText("");
      if (jobDescInputRef.current) {
        jobDescInputRef.current.value = "";
      }
    }
    console.log(`Cleared ${type} files`);
  };

  const handleFileChange = async (files, type) => {
    const validFiles = Array.from(files).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (validFiles.length > 0) {
      console.log(`${type} files selected:`, validFiles.map((f) => f.name));

      const file = validFiles[0]; // Handle only the first file for simplicity

      try {
        setLoading(true); // Show the loading dialog
        setLoadingMessage(`Processing ${type} file...`);
        let extractedText = "";

        if (file.type === "application/pdf") {
          extractedText = await pdfToText(URL.createObjectURL(file));
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          extractedText = await extractTextFromDocx(file);
        }

        console.log(`Extracted text from ${type}:`, extractedText);

        if (type === "Resume") {
          setResumeFiles([file]);
          setResumeText(extractedText);
        } else {
          setJobDescFiles([file]);
          setJobDescText(extractedText);
        }
      } catch (error) {
        console.error(`Error processing ${type} file:`, error);
        alert(`Failed to extract text from the uploaded ${type}.`);
      } finally {
        setLoading(false); // Hide the loading dialog
      }
    }
  };

  const handleDropResume = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResume(false);
    handleFileChange(e.dataTransfer.files, "Resume");
  }, []);

  const handleDropJobDesc = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingJobDesc(false);
    handleFileChange(e.dataTransfer.files, "Job Description");
  }, []);

  const DropZone = ({
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    isDragging,
    files,
    title,
    inputRef,
    type,
  }) => (
    <>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept=".pdf,.docx"
        onChange={(e) => handleFileChange(e.target.files, type)}
        multiple={false}
      />
      <Paper
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        variant="outlined"
        sx={{
          height: "45px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 1,
          backgroundColor: isDragging ? "#f0f7ff" : "background.paper",
          borderColor: isDragging ? "primary.main" : "#808080",
          borderStyle: "dashed",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 20, color: "action.active" }} />
        <Typography variant="caption" noWrap sx={{ fontWeight: "bold" }}>
          {files.length > 0 ? files.map((f) => f.name).join(", ") : title}
        </Typography>
        {files.length > 0 && (
          <IconButton
            size="small"
            onClick={(e) => handleClear(e, type)}
            sx={{
              mr: -0.5,
              "&:hover": {
                color: "error.main",
              },
            }}
          >
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Paper>
    </>
  );

  // Styles for the table
  const styles = {
    cell: {
      borderBottom: '1px solid grey', // Only the bottom border is visible
      borderColor: "#D2D2D2",
      padding: '10px',
      textAlign: 'left',
      maxWidth: '100px',
      width: '100px',
    },
    row: {
      borderBottom: '1px solid grey',
    },
  };

  // Handle the "Start" button click
  const handleStart = (id) => {
    alert(`Start clicked for entry ID: ${id}`);
  };

  // Handle the "Delete" button click
  const handleDelete = (id) => {
    deleteSessionData(id)
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
  };

  const [openDialog, setOpenDialog] = useState(false);

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);

    // Extract day, month, and year
    const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`; // Construct the desired format
  };

  const cellStyles = {
    titleCell: {
      padding: '5px', // Reduced padding for header cells
      backgroundColor: '#F2F2F2',
      fontWeight: 'bold',
      fontSize: '14px',
      textAlign: 'left',
    },
    cell: {
      padding: '5px', // Reduced padding for body cells
      fontSize: '14px', // Slightly smaller font size
      lineHeight: '1.2', // Reduced line height for compact appearance
      borderBottom: '1px solid grey', // Only the bottom border is visible
      borderColor: "#CCCCCC",
      textAlign: 'center',
    },
    row: {
      height: 'auto', // Let the row adjust based on reduced padding
    },
  };

  const SavedSessions = ({ entries, handleStart, handleDelete }) => {
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header">
          <Typography sx={{ fontWeight: "bold", fontSize: "14px" }}>
            SAVED SESSIONS LIST
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: '16px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={styles.titleCell}>
                  <Typography variant="subtitle1" fontWeight="bold" fontSize={"14px"} paddingLeft={"10px"} backgroundColor='#F2F2F2'>
                    Name
                  </Typography>
                </th>
                <th style={styles.titleCell}>
                  <Typography variant="subtitle1" fontWeight="bold" fontSize={"14px"} paddingLeft={"10px"} backgroundColor='#F2F2F2'>
                    Title
                  </Typography>
                </th>
                <th style={styles.titleCell}>
                  <Typography variant="subtitle1" fontWeight="bold" fontSize={"14px"} paddingLeft={"10px"} backgroundColor='#F2F2F2'>
                    Created
                  </Typography>
                </th>
                <th style={styles.titleCell}>
                  <Typography variant="subtitle1" fontWeight="bold" fontSize={"14px"} paddingLeft={"10px"} backgroundColor='#F2F2F2'>
                    Actions
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(entries) && entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} style={cellStyles.row}>
                    <td style={cellStyles.cell}>
                      <Typography fontSize={"12px"}>{entry.candidate_name}</Typography>
                    </td>
                    <td style={cellStyles.cell}>
                      <Typography fontSize={"12px"}>{entry.role}</Typography>
                    </td>
                    <td style={cellStyles.cell}>
                      <Typography fontSize={"12px"}>{formatDate(entry.created_at)}</Typography>
                    </td>
                    <td style={cellStyles.cell}>
                      <IconButton onClick={() => handleStart(entry.id)} sx={{ color: '#427ef5' }}>
                        <PlayCircleFilledWhiteOutlinedIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(entry.id)} sx={{ color: 'grey' }}>
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', ...styles.cell }}>
                    No entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AccordionDetails>
      </Accordion>
    );
  }


  // MediaQuery hook to check if the screen is mobile (xs) or larger
  const isMobile = useMediaQuery('(max-width:600px)'); // Adjust this breakpoint as needed
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline enableColorScheme />
      <AppBar position="fixed" sx={{ background: "#FFFFFF" }} color='transparent'>
        <Toolbar>
          <IconButton>
            <DonutSmallIcon />
          </IconButton>
          <Typography variant="title"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              marginLeft: '10px',
              color: '#00AEEF'
            }}>
            TITLE
          </Typography>

          <Typography
            sx={{
              flexGrow: 1,
              alignContent: "center",
              fontSize: 14,
            }}>
            INTERVIEW PRE-CHECK
          </Typography>
          {/* Right side: Logout Button */}
          {!isMobile && (
            <Button edge="end" color="inherit" variant="outlined"
              startIcon={<LogoutOutlinedIcon />} onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                color: 'black',
                borderColor: 'black',
                borderRadius: '10px',
                marginLeft: '10px', // Space between the Record and Stop button
                fontSize: '12px'
              }}
            >
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
      <Stack direction={isSmallScreen ? "column" : "row"}>
        <Container maxWidth="100%" sx={{ backgroundColor: "#FAFAFA", alignContent: "top" }} >
          <LandingContent />
        </Container>
        <Container>
          <Stack direction='column' alignItems="center" spacing={1} paddingBottom={"80px"} marginTop={"80px"}>
            <Container>
              <SavedSessions
                entries={entries}
                handleStart={handleStart}
                handleDelete={handleDelete}
              />
            </Container>
            {/* <Divider orientation={isSmallScreen ? 'horizontal' : 'vertical'} variant="middle" flexItem /> */}
            <Container sx={{ height: '100vh', alignItems: "center" }}>
              <Box sx={{ padding: '10px', mx: "auto", maxWidth: "800px" }}>
                <Box sx={{ marginTop: '10px' }} />
                <Typography alignContent="center" sx={{ fontWeight: "bold", mb: 2, fontSize: "14px" }}>
                  UPLOAD RESUME & JOB DESCRIPTION
                </Typography>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    {/* Resume Section */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <UploadFileIcon color="primary" />
                          <Typography
                            variant="caption"
                            color="textPrimary"
                            sx={{ fontWeight: "bold", fontSize: '13px' }}
                          >
                            Upload Resume
                          </Typography>
                        </Stack>
                        <DropZone
                          onDragEnter={(e) => handleDrag(e, setIsDraggingResume)}
                          onDragLeave={(e) => handleDrag(e, setIsDraggingResume)}
                          onDragOver={(e) => handleDrag(e, setIsDraggingResume)}
                          onDrop={handleDropResume}
                          isDragging={isDraggingResume}
                          files={resumeFiles}
                          title="Drag & Drop here (PDF/DOCX)"
                          inputRef={resumeInputRef}
                          type="Resume"
                        />
                        <TextField
                          multiline
                          rows={5}
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Enter Resume here"
                          fullWidth
                        />
                      </Stack>
                    </Paper>

                    {/* Job Description Section */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <UploadFileIcon color="primary" />
                          <Typography
                            variant="caption"
                            color="textPrimary"
                            sx={{ fontWeight: "bold", fontSize: '13px' }}
                          >
                            Upload Job Description
                          </Typography>
                        </Stack>
                        <DropZone
                          onDragEnter={(e) => handleDrag(e, setIsDraggingJobDesc)}
                          onDragLeave={(e) => handleDrag(e, setIsDraggingJobDesc)}
                          onDragOver={(e) => handleDrag(e, setIsDraggingJobDesc)}
                          onDrop={handleDropJobDesc}
                          isDragging={isDraggingJobDesc}
                          files={jobDescFiles}
                          title="Drag & Drop here (PDF/DOCX)"
                          inputRef={jobDescInputRef}
                          type="Job Description"
                        />
                        <TextField
                          multiline
                          rows={5}
                          value={jobDescText}
                          onChange={(e) => setJobDescText(e.target.value)}
                          placeholder="Enter Job description here"
                          fullWidth
                        />
                      </Stack>
                    </Paper>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!resumeText || !jobDescText}
                      fullWidth
                    >
                      START INTERVIEW NOW
                    </Button>

                    <Button
                      variant="contained"
                      disabled={!resumeText || !jobDescText}
                      fullWidth
                      onClick={handleDialogOpen}
                    >
                      SAVE SESSION
                    </Button>

                    <Container margin="20px" />

                  </Stack>
                </form>

                {/* Loading Dialog */}
                <Dialog open={loading}>
                  <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress />
                    <Typography>{loadingMessage}</Typography>
                  </DialogContent>
                </Dialog>

                <CandidateFormDialog
                  open={openDialog}
                  onClose={handleDialogClose}
                  resume={resumeText}
                  jobDesc={jobDescText} />
              </Box>
            </Container>
          </Stack>
        </Container>
      </Stack>
    </ThemeProvider >
  );
}
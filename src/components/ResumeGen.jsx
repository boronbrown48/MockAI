import React, { useState, useCallback, useRef } from 'react';
import {
    AppBar,
    Container,
    Paper,
    Button,
    Typography,
    Box,
    IconButton,
    TextField,
    Dialog,
    DialogContent,
    CircularProgress,
    InputLabel,
    MenuItem,
    Select,
    FormControl,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Toolbar,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    UploadFile as UploadFileIcon,
    Clear as ClearIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';

import { extractTextFromDocx } from './DocxExtractor';
import pdfToText from './PdfOcr';

import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import './ResumeGen.css';

const ACCEPTED_FILE_TYPES = {
    PDF: 'application/pdf',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const PRIORITY_OPTIONS = [
    { value: 'business', label: 'Business-Centric' },
    { value: 'tech', label: 'Tech-Centric' },
    { value: 'mixed', label: 'Mixed' }
];

// Sample data - in a real app, this would come from an API or props
const INITIAL_TABLE_DATA = [
    { id: 1, role: "Admin", competitors: "Google, Meta", created: "2023-12-18" },
    { id: 2, role: "User", competitors: "Google, Meta", created: "2023-12-17" },
    { id: 3, role: "Manager", competitors: "Google, Meta", created: "2023-12-16" }
];

const TypographyHeader = ({ children }) => (
    <Typography
        variant="caption"
        color="textPrimary"
        sx={{ fontWeight: "bold", fontSize: "13px" }}
    >
        {children}
    </Typography>
);

const DataTable = ({ data, onView, onDelete }) => (
    <Accordion elevation={2}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel-content"
            id="panel-header"
        >
            <TypographyHeader>Saved Resumes List</TypographyHeader>
        </AccordionSummary>
        <AccordionDetails>
            <TableContainer>
                <Table sx={{ tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ padding: "2px" }}>
                                <Typography sx={{ paddingLeft: "10px" }} fontSize={"14px"} fontWeight="bold" backgroundColor="#F2F2F2">Role</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: "1px" }}>
                                <Typography sx={{ paddingLeft: "10px" }} fontSize={"14px"} fontWeight="bold" backgroundColor="#F2F2F2">Competitors</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: "1px" }}>
                                <Typography sx={{ paddingLeft: "10px" }} fontSize={"14px"} fontWeight="bold" backgroundColor="#F2F2F2">Created</Typography>
                            </TableCell>
                            <TableCell sx={{ padding: "1px" }}>
                                <Typography sx={{ paddingLeft: "10px" }} fontSize={"14px"} fontWeight="bold" backgroundColor="#F2F2F2">Action</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id} sx={{ height: "36px" }}>
                                <TableCell sx={{ padding: "4px 8px" }}><Typography fontSize={"14px"}>{item.role}</Typography></TableCell>
                                <TableCell sx={{ padding: "4px 8px" }}><Typography fontSize={"14px"}>{item.competitors}</Typography></TableCell>
                                <TableCell sx={{ padding: "4px 8px" }}><Typography fontSize={"14px"}>{item.created}</Typography></TableCell>
                                <TableCell sx={{ padding: "4px 8px" }}>
                                    <IconButton
                                        onClick={() => onView(item.id)}
                                        aria-label="View"
                                        size="small"
                                        sx={{ color: "#00AEEF" }}
                                    >
                                        <RemoveRedEyeOutlinedIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => onDelete(item.id)}
                                        aria-label="Delete"
                                        size="small"
                                    >
                                        <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </AccordionDetails>
    </Accordion>
);

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
    handleFileChange,
    handleClear
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
                height: "35px",
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
                {files.length > 0 ? files[0].name : title}
            </Typography>
            {files.length > 0 && (
                <IconButton
                    size="small"
                    onClick={(e) => handleClear(e, type)}
                    sx={{
                        mr: -0.5,
                        "&:hover": { color: "error.main" },
                    }}
                >
                    <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
            )}
        </Paper>
    </>
);

const ResumeGenerator = ({ setIsAuthenticated }) => {
    const [resumeFiles, setResumeFiles] = useState([]);
    const [resumeText, setResumeText] = useState("");
    const [competitors, setCompetitors] = useState("");
    const [isDraggingResume, setIsDraggingResume] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const [tableData, setTableData] = useState(INITIAL_TABLE_DATA);

    const [docxBlob, setDocxBlob] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const resumeInputRef = useRef(null);

    const handleDrag = useCallback((e, setDragging) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(e.type === "dragenter" || e.type === "dragover");
    }, []);

    const handleClear = useCallback((e, type) => {
        e.stopPropagation();
        if (type === "Resume") {
            setResumeFiles([]);
            setResumeText("");
            if (resumeInputRef.current) {
                resumeInputRef.current.value = "";
            }
        }
    }, []);

    const handleFileChange = useCallback(async (files, type) => {
        const validFiles = Array.from(files).filter(
            (file) => Object.values(ACCEPTED_FILE_TYPES).includes(file.type)
        );

        if (!validFiles.length) return;

        const file = validFiles[0];

        try {
            setLoading(true);
            setLoadingMessage(`Processing ${type} file...`);

            const extractedText = file.type === ACCEPTED_FILE_TYPES.PDF
                ? await pdfToText(URL.createObjectURL(file))
                : await extractTextFromDocx(file);

            setResumeFiles([file]);
            setResumeText(extractedText);
        } catch (error) {
            console.error(`Error processing ${type} file:`, error);
            alert(`Failed to extract text from the uploaded ${type}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDropResume = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingResume(false);
        handleFileChange(e.dataTransfer.files, "Resume");
    }, [handleFileChange]);

    const handleView = useCallback((id) => {
        console.log("View clicked for ID:", id);
        // Add your view logic here
    }, []);

    const handleDelete = useCallback((id) => {
        console.log("Delete clicked for ID:", id);
        setTableData(prev => prev.filter(item => item.id !== id));
    }, []);

    const DocxViewer = ({ blob }) => {
        const [html, setHtml] = useState('');

        React.useEffect(() => {
            const loadDocument = async () => {
                if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setHtml(result.value);
                }
            };

            loadDocument();
        }, [blob]);

        return (
            <Box
                sx={{
                    height: '500px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    overflow: 'auto',
                    p: 2,
                    bgcolor: 'white'
                }}
            >
                <div
                    dangerouslySetInnerHTML={{ __html: html }}
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}
                />
            </Box>
        );
    };

    const createDocxFromData = async (data) => {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Job Description",
                                bold: true,
                                size: 32,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun("")],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Role Description:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.resumeText,
                                size: 22,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun("")],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Competitors:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.competitors,
                                size: 22,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun("")],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Priority:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.priority,
                                size: 22,
                            }),
                        ],
                    }),
                ],
            }],
        });

        return await Packer.toBlob(doc);
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoadingMessage("Generating document...");

        try {
            const data = {
                resumeText,
                competitors,
                priority: selectedValue
            };

            const blob = await createDocxFromData(data);
            setDocxBlob(blob);
            setShowPreview(true);
        } catch (error) {
            console.error("Error generating document:", error);
            alert("Failed to generate document");
        } finally {
            setLoading(false);
        }
    }, [resumeText, competitors, selectedValue]);

    const handleDownload = useCallback(() => {
        if (docxBlob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(docxBlob);
            link.download = 'job_description.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [docxBlob]);

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
        typography: {
            fontSize: 13,
            fontFamily: 'Arial',
            h5: {
                fontFamily: 'Arial, sans-serif', // Font for h5
            },
        },
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
                main: '#2c2fd4'
            }
        },
    });

    // MediaQuery hook to check if the screen is mobile (xs) or larger
    const isMobile = useMediaQuery('(max-width:600px)'); // Adjust this breakpoint as needed
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <>
            <style>
                {`
                    body, html {
                        margin: 10px;
                        padding: 0;
                        height: 100%;
                    }
                `}
            </style>
            <ThemeProvider theme={lightTheme}>
                <CssBaseline />
                <AppBar position="fixed" sx={{ width: '100%', backgroundColor: '#FFFFFF' }}>
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left side: Logo */}
                        <IconButton edge="start" sx={{ mr: 2 }} color="inherit">
                            <DonutSmallIcon sx={{ color: 'black' }} />
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
                                color: '#000000',
                            }}>
                            RESUME BUILDER
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
                <div style={{ padding: 0, marginTop: 60 }}>
                    <Stack direction={isSmallScreen ? 'column' : 'row'} spacing={1}>
                        <Box sx={{ width: "100%", p: 2 }}>
                            <Typography alignContent="center" fontSize={"14px"} sx={{ fontWeight: "bold", ml: 1, mb: 2 }}>
                                Resume Creator
                            </Typography>
                            <form onSubmit={handleSubmit}>
                                <Stack spacing={3}>
                                    <Paper elevation={2} sx={{ p: 3 }}>
                                        <Stack spacing={2}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <UploadFileIcon sx={{ color: "#00AEEF" }} />
                                                <TypographyHeader>Upload Job Description</TypographyHeader>
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
                                                handleFileChange={handleFileChange}
                                                handleClear={handleClear}
                                            />

                                            <TextField
                                                multiline
                                                rows={5}
                                                value={resumeText}
                                                onChange={(e) => setResumeText(e.target.value)}
                                                placeholder="Enter Resume here"
                                                fullWidth
                                                sx={{ fontSize: "12px" }}
                                            />

                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <UploadFileIcon sx={{ color: "#00AEEF" }} />
                                                <TypographyHeader>Enter Competitors</TypographyHeader>
                                            </Stack>

                                            <TextField
                                                value={competitors}
                                                onChange={(e) => setCompetitors(e.target.value)}
                                                placeholder="Enter Competitors here"
                                                fullWidth
                                            />

                                            <FormControl
                                                sx={{ minWidth: 150 }}
                                                size="small"
                                            >
                                                <InputLabel id="priority-label">
                                                    <TypographyHeader>Select Priority</TypographyHeader>
                                                </InputLabel>
                                                <Select
                                                    labelId="priority-label"
                                                    value={selectedValue}
                                                    onChange={(e) => setSelectedValue(e.target.value)}
                                                    label="Priority"
                                                >
                                                    <MenuItem value="">
                                                        <TypographyHeader>None</TypographyHeader>
                                                    </MenuItem>
                                                    {PRIORITY_OPTIONS.map(({ value, label }) => (
                                                        <MenuItem key={value} value={value} sx={{ justifyContent: "flex-start" }}>
                                                            <TypographyHeader>{label}</TypographyHeader>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Paper>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={!resumeText || !competitors || !selectedValue}
                                        fullWidth
                                    >
                                        GENERATE RESUME
                                    </Button>
                                </Stack>
                            </form>

                            <Dialog open={loading}>
                                <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <CircularProgress />
                                    <Typography>{loadingMessage}</Typography>
                                </DialogContent>
                            </Dialog>
                        </Box>

                        <Container sx={{ backgroundColor: "#FAFAFA" }}>
                            <Stack direction={"column"} marginTop={"20px"}>
                                <DataTable
                                    data={tableData}
                                    onView={handleView}
                                    onDelete={handleDelete}
                                />
                                <Typography alignContent="center" fontSize={"14px"} sx={{ fontWeight: "bold", mt: 2, ml: 1, mb: 0 }}>
                                    Resume Preview will be Displayed here
                                </Typography>
                                {showPreview && (
                                    <Box sx={{ mt: 3 }}>
                                        <Paper elevation={2} sx={{ p: 3 }}>
                                            <Stack spacing={2}>
                                                <Typography variant="subtitle" fontWeight={"bold"}>Document Preview</Typography>
                                                <DocxViewer blob={docxBlob} />
                                                <Button
                                                    variant="contained"
                                                    startIcon={<DownloadIcon />}
                                                    onClick={handleDownload}
                                                    fullWidth
                                                >
                                                    Download Document
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    </Box>
                                )}
                            </Stack>

                        </Container>
                    </Stack>
                </div>
            </ThemeProvider>
        </>
    );
};

export default ResumeGenerator;
import React, { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Grid,
    Typography,
} from '@mui/material';

export default function CandidateFormDialog({ open, onClose, resume, jobDesc }) {
    const [candidateName, setCandidateName] = useState('');
    const [role, setRole] = useState('');

    const BASE_URL = "https://mockaibackend.vercel.app";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requestData = {
            candidate_name: candidateName,
            job_description: jobDesc,
            resume: resume,
            client_id: localStorage.getItem('client_id'),
            role: role,
        };

        try {
            const response = await fetch(`${BASE_URL}/add_session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            // Check if the response is successful
            if (!response.ok) {
                const errorData = await response.json();
                console.error(errorData)
                // setError(errorData.detail || 'An error occurred');
                // setResponseMessage('');
            } else {
                const data = await response.json();
                console.log(data)

                setCandidateName("");
                setRole("");
                onClose();
            }
        } catch (err) {
            console.log('Network error occurred');
            // setResponseMessage('');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { width: '500px' } }}>
            <DialogTitle sx={{ paddingLeft: 3, paddingRight: 0, paddingBottom: 0, paddingTop: 2 }}>
                <Typography
                    color="textPrimary"
                    sx={{ fontWeight: "bold", fontSize: '16px' }}>
                    Add Session
                </Typography></DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container direction="column" spacing={2}>
                        <Grid item>
                            <TextField
                                label="Candidate Name"
                                variant="outlined"
                                fullWidth
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <TextField
                                label="Role"
                                variant="outlined"
                                fullWidth
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Cancel
                    </Button>
                    <Button type="submit" color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

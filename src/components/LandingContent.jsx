import * as React from 'react';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';

const items = [
  {
    icon: <SettingsSuggestRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Candidate\'s Resume',
    description:
      'Please upload resume to train the AI further to get accurate answers',
  },
  {
    icon: <ConstructionRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Let the AI analyse',
    description:
      'Let the AI analyse the resume before uploading the Job Description',
  },
  {
    icon: <ThumbUpAltRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Upload Job Description',
    description:
      'Job Description will be a guide for AI in Interview for tailored answers',
  },
  {
    icon: <AutoFixHighRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Start the Intervieww',
    description:
      'Once files are uploaded AI is ready to start',
  },
];

export default function LandingContent() {
  return (
    <Stack
      sx={{ flexDirection: 'column', gap: 4, maxWidth: 600, marginLeft: 5 }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, marginTop: '60px' }}>
      </Box>
      <Typography sx={{ fontWeight: 'bold', fontSize: 14 }}>
        USAGE INSTRUCTIONS
      </Typography>
      {/* <Divider orientation="horizontal" maxWidth="20px" flexItem /> */}
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2, alignContent: 'left', justifyContent: 'left' }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: 'bold', fontSize: 14 }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
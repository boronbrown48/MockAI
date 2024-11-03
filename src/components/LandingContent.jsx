import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';

import { Google } from '@mui/icons-material';

const items = [
  {
    icon: <SettingsSuggestRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Candidate\'s Resume',
    description:
      'Please upload candidate to train the AI further to get accurate answers',
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
      'Please upload the Job Description for the upcoming Interview for tailored answers',
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
      sx={{ flexDirection: 'column', alignSelf: 'top', gap: 4, maxWidth: 600, marginRight: 5 }}
    >
      <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Google />
      </Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2, alignContent: 'left', justifyContent: 'left' }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
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
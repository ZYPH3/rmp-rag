'use client'
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import SendIcon from '@mui/icons-material/Send';
import RateReviewIcon from '@mui/icons-material/RateReview'; // Fun icon for the top-left corner
import { keyframes } from '@mui/system';

// Keyframes for animations
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am the Rate My Professor Support Assistant. How can I help you today?"
    }
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages, 
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');

    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify([...messages, { role: "user", content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text }
          ];
        });

        return reader.read().then(processText);
      });
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column" 
      justifyContent="center"
      alignItems="center"
      bgcolor="#121212" // Dark mode background
      color="#e0e0e0" // Light text color for dark mode
      fontFamily="'Arial', sans-serif"
      position="relative"
      p={2}
    >
      {/* Rate My Professor Icon */}
      <Box
        position="absolute"
        top={16}
        left={16}
        display="flex"
        alignItems="center"
        zIndex={10}
      >
        <RateReviewIcon sx={{ fontSize: 50, color: '#1e88e5', animation: `${bounce} 2s infinite` }} />
        <Typography variant="h5" sx={{ ml: 1, color: '#1e88e5', fontWeight: 'bold', fontFamily: "'Roboto', sans-serif" }}>
          Rate My Professor
        </Typography>
      </Box>

      <Stack 
        direction="column" 
        width="100%"
        maxWidth="600px" 
        height="80%"
        border="1px solid #333" // Border color for dark mode
        borderRadius="20px"
        p={2}
        spacing={3}
        boxShadow="0px 6px 12px rgba(0, 0, 0, 0.3)"
        bgcolor="#1e1e1e" // Dark mode background for the chat container
        overflow="hidden"
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box 
              key={index}
              display="flex"
              justifyContent={message.role === "assistant" ? "flex-start" : 'flex-end'}
              mb={1}
              sx={{ animation: `${fadeIn} 1s` }}
            >
              <Box 
                bgcolor={message.role === 'assistant' ? "#333" : "#1e88e5"} // Dark background for assistant, bright blue for user
                color={message.role === 'assistant' ? "#e0e0e0" : "#ffffff"} // Light text on dark background
                borderRadius="20px"
                p={2}
                boxShadow="0px 4px 8px rgba(0, 0, 0, 0.3)"
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.4)',
                    transform: 'scale(1.02)',
                  }
                }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <TextField
            label="Message"
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            sx={{
              input: { color: '#e0e0e0' }, // Light text color
              label: { color: '#ffffff' }, // White label color
              fieldset: { borderColor: '#333' }, // Dark border color
              '&.Mui-focused fieldset': { borderColor: '#1e88e5' }, // Blue border on focus
            }}
          />
          <Button
            variant='contained'
            onClick={sendMessage}
            sx={{
              background: '#1e88e5',
              borderRadius: '20px',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'none',
              padding: '10px 20px',
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                background: '#1565c0',
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.4)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <SendIcon sx={{ mr: 1 }} />
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

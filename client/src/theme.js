import { createTheme } from '@mui/material/styles';

// Modern font system theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1'
    },
    secondary: {
      main: '#64748b'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      'sans-serif'
    ].join(','),
    fontSize: 14,
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    body1: {
      lineHeight: 1.7
    },
    body2: {
      lineHeight: 1.6
    }
  }
});

export default theme; 
import { createTheme } from '@mui/material/styles';

// Có thể tuỳ chỉnh theme tại đây nếu muốn
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

export default theme; 
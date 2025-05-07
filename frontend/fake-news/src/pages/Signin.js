import { Box, Container, Paper, Typography, TextField, Button, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';

function Signin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = e => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (
      storedUser &&
      storedUser.email === credentials.email &&
      storedUser.password === credentials.password
    ) {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/profile');
    } else {
      alert('Email ou mot de passe incorrect');
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: 'url("/images/fake-news.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Connexion
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              name="email"
              label="Adresse e-mail"
              type="email"
              fullWidth
              margin="normal"
              onChange={handleChange}
              required
            />
            <TextField
              name="password"
              label="Mot de passe"
              type="password"
              fullWidth
              margin="normal"
              onChange={handleChange}
              required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Se connecter
            </Button>
          </form>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Vous n'avez pas de compte ?{' '}
            <Link component={RouterLink} to="/signup">
              Créer un compte
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Signin;

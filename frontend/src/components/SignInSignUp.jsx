import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, TextField, Typography,
  Button, Paper, InputAdornment
} from '@mui/material';
import { AccountCircle, Lock, Email, PersonAdd, Login } from '@mui/icons-material';

const SignInSignUp = ({ onAuthentication }) => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const toggleMode = () => setIsSignup(prev => !prev);
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        // Enregistrement utilisateur
        await axios.post('http://localhost:5000/user_auth/register', formData);
        alert('Inscription réussie ! Connectez-vous.');
        setIsSignup(false);
      } else {
        // Connexion utilisateur
        const { data } = await axios.post('http://localhost:5000/user_auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        // Stockage du token et des données utilisateur
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log(data.access_token);
        
        // Mise à jour de l'état d'authentification
        onAuthentication();
        navigate('/');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(to right, #1d2b64, #f8cdda)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <Container maxWidth="sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Paper elevation={24} sx={{
            p: 5,
            borderRadius: 6,
            backdropFilter: 'blur(15px)',
            background: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  onClick={() => setIsSignup(false)}
                  variant={isSignup ? 'outlined' : 'contained'}
                  color="primary"
                  startIcon={<Login />}
                  sx={{ px: 3, borderRadius: 3 }}
                >
                  Se connecter
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  onClick={() => setIsSignup(true)}
                  variant={isSignup ? 'contained' : 'outlined'}
                  color="secondary"
                  startIcon={<PersonAdd />}
                  sx={{ px: 3, borderRadius: 3 }}
                >
                  S'inscrire
                </Button>
              </motion.div>
            </Box>

            <motion.div
              key={isSignup ? 'signup' : 'signin'}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#fff' }}>
                {isSignup ? "Créer un compte" : "Connexion"}
              </Typography>

              <form onSubmit={handleSubmit}>
                {isSignup && (
                  <TextField
                    label="Nom d'utilisateur"
                    name="username"
                    fullWidth
                    margin="normal"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle sx={{ color: '#555' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ input: { color: '#fff' }, label: { color: '#ccc' } }}
                  />
                )}
                <TextField
                  label="Adresse e-mail"
                  name="email"
                  type="email"
                  fullWidth
                  margin="normal"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#555' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ input: { color: '#fff' }, label: { color: '#ccc' } }}
                />
                <TextField
                  label="Mot de passe"
                  name="password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#555' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ input: { color: '#fff' }, label: { color: '#ccc' } }}
                />
                <motion.div whileHover={{ scale: 1.03 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 'bold',
                      background: 'linear-gradient(to right, #667eea, #764ba2)',
                      boxShadow: '0 4px 20px rgba(118, 75, 162, 0.5)',
                    }}
                  >
                    {isSignup ? "S'inscrire" : "Se connecter"}
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SignInSignUp;
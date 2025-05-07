import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Stack,
} from '@mui/material';

const categories = ['Développement', 'Réseaux', 'Design', 'IA', 'Sécurité', 'Autre'];

function EditProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [categorie, setCategorie] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUsername(storedUser.username || '');
      setEmail(storedUser.email || '');
      setCategorie(storedUser.categorie || '');
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  const handleSave = () => {
    const updatedUser = {
      ...JSON.parse(localStorage.getItem('user')),
      username,
      email,
      categorie,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    navigate('/profile');
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, width: '100%' }}>
        <Typography variant="h5" align="center" gutterBottom>
          Modifier le profil
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Nom d'utilisateur"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            select
            label="Catégorie"
            fullWidth
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" color="primary" onClick={handleSave}>
            Enregistrer
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

export default EditProfile;

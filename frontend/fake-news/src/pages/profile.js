import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Box,
} from '@mui/material';
import { deepPurple } from '@mui/material/colors';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/signin');
    } else {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUser(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  if (!user) return <Typography>Chargement...</Typography>;

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f9fc',
        py: 4,
      }}
    >
      <Card
        elevation={4}
        sx={{
          width: '100%',
          borderRadius: 4,
          p: 3,
          background: '#ffffff',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: deepPurple[500], width: 80, height: 80, fontSize: 32 }}>
            {user.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" fontWeight={600}>
            {user.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <CardContent>
          <Stack spacing={1.5}>
            <Typography><strong>Points :</strong> {user.points}</Typography>
            <Typography><strong>Catégorie :</strong> {user.categorie || 'Non spécifiée'}</Typography>
            <Typography><strong>Rôle :</strong> {user.isAdmin ? 'Administrateur' : 'Utilisateur'}</Typography>
          </Stack>
        </CardContent>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            color="primary"
            onClick={handleEditProfile}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Modifier le profil
          </Button>
          <Button
            variant="outlined"
            fullWidth
            color="error"
            onClick={handleLogout}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Se déconnecter
          </Button>
        </Box>
      </Card>
    </Container>
  );
}

export default Profile;

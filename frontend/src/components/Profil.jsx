import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip
} from '@mui/material';
import { deepPurple } from '@mui/material/colors';

// Schéma de validation pour le profil
const profileValidationSchema = Yup.object({
  username: Yup.string().required('Le nom d\'utilisateur est requis'),
  email: Yup.string().email('Email invalide').required('L\'email est requis'),
  categories: Yup.array().of(Yup.string())
});

// Schéma de validation pour le mot de passe
const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Le mot de passe actuel est requis'),
  newPassword: Yup.string()
    .min(6, 'Minimum 6 caractères')
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .required('La confirmation est requise')
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe doivent correspondre')
});

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [categoriesList] = useState(['Débutant', 'Intermédiaire', 'Expert', 'Design', 'Développement', 'Marketing']);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAuthenticated');
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    
    if (!isLoggedIn) {
      navigate('/auth');
    } else {
      setUser({
        ...storedUser,
        categories: storedUser.categories || []
      });
    }
  }, [navigate]);

  // Formik pour les informations du profil
  const profileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: user?.username || '',
      email: user?.email || '',
      categories: user?.categories || []
    },
    validationSchema: profileValidationSchema,
    onSubmit: (values) => {
      const updatedUser = {
        ...user,
        ...values
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditOpen(false);
    }
  });

  // Formik pour le changement de mot de passe
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: (values) => {
      if (values.currentPassword === user?.password) {
        const updatedUser = {
          ...user,
          password: values.newPassword
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPasswordOpen(false);
        passwordFormik.resetForm();
      } else {
        passwordFormik.setFieldError('currentPassword', 'Mot de passe actuel incorrect');
      }
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleAdminRequest = () => {
    navigate('/admin-request');
  };

  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => {
    setEditOpen(false);
    profileFormik.resetForm();
  };

  const handlePasswordOpen = () => setPasswordOpen(true);
  const handlePasswordClose = () => {
    setPasswordOpen(false);
    passwordFormik.resetForm();
  };

  if (!user) return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6">Chargement du profil...</Typography>
    </Container>
  );

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          borderRadius: 4,
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(6px)'
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ 
            bgcolor: deepPurple[500], 
            width: 80, 
            height: 80, 
            fontSize: 32,
            mb: 2
          }}>
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
          <Stack spacing={2}>
            <Typography>
              <strong>Points :</strong> {user.points || 0}
            </Typography>
            
            <Typography>
              <strong>Catégories :</strong> 
              {user.categories?.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {user.categories.map(cat => (
                    <Chip key={cat} label={cat} size="small" />
                  ))}
                </Box>
              ) : 'Aucune catégorie'}
            </Typography>
            
            <Typography>
              <strong>Rôle :</strong> {user.isAdmin ? 'Administrateur' : 'Utilisateur'}
            </Typography>
          </Stack>
        </CardContent>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            color="primary"
            onClick={handleEditOpen}
            sx={{ borderRadius: 2 }}
          >
            Modifier le profil
          </Button>

          <Button
            variant="outlined"
            fullWidth
            color="primary"
            onClick={handlePasswordOpen}
            sx={{ borderRadius: 2 }}
          >
            Modifier le mot de passe
          </Button>

          {!user.isAdmin && (
            <Button
              variant="outlined"
              fullWidth
              color="secondary"
              onClick={handleAdminRequest}
              sx={{ borderRadius: 2 }}
            >
              Demander le statut admin
            </Button>
          )}

          <Button
            variant="contained"
            fullWidth
            color="error"
            onClick={handleLogout}
            sx={{ borderRadius: 2 }}
          >
            Se déconnecter
          </Button>
        </Box>
      </Card>

      {/* Dialogue de modification du profil */}
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 600
        }}>
          Modifier le profil
        </DialogTitle>
        
        <form onSubmit={profileFormik.handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                name="username"
                label="Nom d'utilisateur"
                value={profileFormik.values.username}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.username && !!profileFormik.errors.username}
                helperText={profileFormik.touched.username && profileFormik.errors.username}
              />

              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={profileFormik.values.email}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.email && !!profileFormik.errors.email}
                helperText={profileFormik.touched.email && profileFormik.errors.email}
              />

              <FormControl fullWidth>
                <InputLabel>Catégories préférées</InputLabel>
                <Select
                  multiple
                  name="categories"
                  value={profileFormik.values.categories}
                  onChange={profileFormik.handleChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categoriesList.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleEditClose} color="secondary">
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialogue de modification du mot de passe */}
      <Dialog open={passwordOpen} onClose={handlePasswordClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 600
        }}>
          Modifier le mot de passe
        </DialogTitle>
        
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                name="currentPassword"
                label="Mot de passe actuel"
                type="password"
                value={passwordFormik.values.currentPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.currentPassword && !!passwordFormik.errors.currentPassword}
                helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              />

              <TextField
                fullWidth
                name="newPassword"
                label="Nouveau mot de passe"
                type="password"
                value={passwordFormik.values.newPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.newPassword && !!passwordFormik.errors.newPassword}
                helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              />

              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.confirmPassword && !!passwordFormik.errors.confirmPassword}
                helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handlePasswordClose} color="secondary">
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Profile;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios'; // Import axios
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
  Chip,
  CircularProgress // Import CircularProgress for loading state
} from '@mui/material';
import { deepPurple } from '@mui/material/colors';

// Schéma de validation pour le profil
const profileValidationSchema = Yup.object({
  username: Yup.string().required('Le nom d\'utilisateur est requis'),
  email: Yup.string().email('Email invalide').required('L\'email est requis'),
  // Assuming categories update will send a list of category labels or IDs
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
  const [loading, setLoading] = useState(true); // Loading state
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  // categoriesList should ideally be fetched from the backend if dynamic
  const [categoriesList] = useState(['Technology', 'Science', 'Business', 'Débutant', 'Intermédiaire', 'Expert', 'Design', 'Développement', 'Marketing']);

  const API_URL = 'http://localhost:5000/user_auth'; // Base URL for user authentication endpoints

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/auth');
    } else {
      const fetchProfile = async () => {
        try {
          const { data } = await axios.get(`${API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          // Assuming the backend returns categories as a list of objects with _id and label
          setUser({
              ...data.user,
              // Map category objects to just their labels for formik initial state
              categories: data.user.categories ? data.user.categories.map(cat => cat.label) : []
          });
          // Store the raw user data with category objects in local storage if needed elsewhere
          // Or store a simplified version, depending on application needs
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Handle token expiration or other errors
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        } finally {
          setLoading(false); // Set loading to false after fetch
        }
      };

      fetchProfile();
    }
  }, [navigate, API_URL]);

  // Formik for profile information
  const profileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: user?.username || '',
      email: user?.email || '',
      // Formik should work with labels for the Select component
      categories: user?.categories || []
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/auth');

      try {
        // When sending updates, you might need to send category IDs instead of labels
        // This depends on your backend update-profile endpoint implementation.
        // For simplicity, we'll send labels, assuming backend can handle it or update backend.
        // If backend expects IDs, you'd need to map labels back to IDs here.
        const { data } = await axios.put(`${API_URL}/update-profile`, values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert(data.message);
        // Refetch profile to get updated user data from the backend,
        // including potentially updated category objects.
        const updatedProfileResponse = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser({
            ...updatedProfileResponse.data.user,
             categories: updatedProfileResponse.data.user.categories ? updatedProfileResponse.data.user.categories.map(cat => cat.label) : []
        });
         localStorage.setItem('user', JSON.stringify(updatedProfileResponse.data.user));


        setEditOpen(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        alert(error.response?.data?.error || 'Une erreur est survenue lors de la mise à jour du profil');
      }
    }
  });

  // Formik for password change
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/auth');

      try {
        const { data } = await axios.put(`${API_URL}/change-password`, {
          current_password: values.currentPassword,
          new_password: values.newPassword
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert(data.message);
        setPasswordOpen(false);
        resetForm();
      } catch (error) {
        console.error("Error changing password:", error);
        alert(error.response?.data?.error || 'Une erreur est survenue lors du changement de mot de passe');
        // Optionally reset only the password fields on error
        passwordFormik.setFieldError('currentPassword', error.response?.data?.error);
      }
    }
  });

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Although the backend primarily instructs client-side removal,
        // a call can be made for potential future backend logout logic
        await axios.post(`${API_URL}/logout`, null, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Error during backend logout call:", error);
        // Continue with client-side logout even if backend call fails
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleAdminRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/auth');

    try {
      const { data } = await axios.post(`${API_URL}/demande-admin`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert(data.message);
      // Optionally refetch profile to show updated role or pending request status
      const updatedProfileResponse = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser({
          ...updatedProfileResponse.data.user,
           categories: updatedProfileResponse.data.user.categories ? updatedProfileResponse.data.user.categories.map(cat => cat.label) : []
      });
       localStorage.setItem('user', JSON.stringify(updatedProfileResponse.data.user));

    } catch (error) {
      console.error("Error requesting admin status:", error);
      alert(error.response?.data?.error || 'Une erreur est survenue lors de la demande admin');
    }
  };

  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => {
    setEditOpen(false);
    profileFormik.resetForm(); // Reset form values on close
  };

  const handlePasswordOpen = () => setPasswordOpen(true);
  const handlePasswordClose = () => {
    setPasswordOpen(false);
    passwordFormik.resetForm(); // Reset form values on close
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6">Chargement du profil...</Typography>
      </Container>
    );
  }

  if (!user) return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6">Impossible de charger le profil.</Typography>
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
              {/* Correctly mapping over categories, assuming they are objects with _id and label */}
              {user.categories?.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {/* Use category._id or category.label as key, and category.label as the Chip label */}
                  {user.categories.map((cat) => (
                    <Chip key={cat._id || cat.label} label={cat.label || cat} size="small" />
                  ))}
                </Box>
              ) : 'Aucune catégorie'}
            </Typography>

            <Typography>
              <strong>Rôle :</strong> {user.role || 'Utilisateur'} {/* Use role from backend */}
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

          {/* Check for explicit role from backend */}
          {user.role !== 'admin' && (
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
                   // Render selected chip labels
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {/* Render menu items with category labels */}
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
            <Button type="submit" variant="contained" color="primary" disabled={profileFormik.isSubmitting}>
              {profileFormik.isSubmitting ? <CircularProgress size={24} /> : 'Enregistrer'}
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
            <Button type="submit" variant="contained" color="primary" disabled={passwordFormik.isSubmitting}>
              {passwordFormik.isSubmitting ? <CircularProgress size={24} /> : 'Enregistrer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Profile;
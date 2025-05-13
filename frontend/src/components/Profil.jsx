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
  // categories will be an array of category _id strings for the Select component
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
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  // categoriesList will hold the full list of available categories fetched from backend
  const [categoriesList, setCategoriesList] = useState([]);
   // State for loading/submitting specifically the profile form
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
   // State for loading/submitting specifically the password form
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);


  const API_URL = 'http://localhost:5000'; // Base URL for all backend endpoints


  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token); // Debug log

    if (!token) {
      console.log('No token found, redirecting to auth'); // Debug log
      navigate('/auth');
    } else {
      // THIS IS THE FETCHING LOGIC THAT CHANGED compared to the older version
      const fetchProfileAndCategories = async () => {
        try {
          setLoading(true); // Start initial loading
          console.log('Fetching profile and categories...'); // Debug log

          // Use Promise.all to fetch both profile and the full list of categories
          const [profileResponse, categoriesResponse] = await Promise.all([
             // Fetch user profile - requires token
            axios.get(`${API_URL}/user_auth/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            // Fetch the list of all categories - this route typically does NOT require a token
            // *** THIS IS THE CALL CAUSING THE CORS ERROR AND THUS THE REDIRECT ***
            axios.get(`${API_URL}/categories`, {
                // The /categories GET route should be publicly accessible and not require auth
                // Sending the token here might be unnecessary but shouldn't cause the CORS preflight redirect itself
                // The backend's failure to handle OPTIONS for this specific route is the issue.
               // headers: { Authorization: `Bearer ${token}` } // You might not need auth header for GET /categories
            })
          ]);

          console.log('Profile response:', profileResponse); // Debug log
          console.log('Categories response:', categoriesResponse); // Debug log

          // Set the user state with the profile data (should contain category objects)
          setUser(profileResponse.data.user);

          // Set the list of all available categories for the dropdown
          // Ensure categoriesResponse.data is an array before setting state
          if (Array.isArray(categoriesResponse.data)) {
             setCategoriesList(categoriesResponse.data);
          } else {
             console.error("Expected categories list as an array from /categories, but received:", categoriesResponse.data);
             // Handle this unexpected response structure - maybe show an error or set empty list
             setCategoriesList([]); // Default to empty array if response format is wrong
             // Optionally setError('Failed to load categories list.');
          }


        } catch (error) {
          console.error("Error fetching data:", error);
          console.log('Error details:', { // More detailed error logging
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
          });

           // *** THIS CATCH BLOCK IS TRIGGERED BY THE BACKEND CORS ERROR ON /categories FETCH ***
           // This is why the token is removed and you are redirected to /auth
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        } finally {
          setLoading(false); // End initial loading regardless of success/failure
        }
      };

      fetchProfileAndCategories();
    }
  }, [navigate, API_URL]); // Added API_URL to dependency array as it's used inside effect

  // Formik for profile information
  const profileFormik = useFormik({
    enableReinitialize: true, // Re-initialize form when user state changes
    initialValues: {
      username: user?.username || '',
      email: user?.email || '',
      // Map the user's selected category objects (from user state) to their _id's
      // The MUI Select component needs the array of values to match the MenuItem 'value'
      categories: user?.categories ? user.categories.map(cat => cat._id) : []
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/auth'); // Ensure token exists before submitting

      try {
        setIsProfileSubmitting(true); // Start submitting state for profile form

        // 1. Update the basic profile info (username, email)
        await axios.put(`${API_URL}/user_auth/update-profile`, {
          username: values.username,
          email: values.email
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Update user's categories based on selected IDs
        // values.categories is already the array of selected category IDs from the form
        const selectedCategoryIds = values.categories;
        const currentUserCategoryIds = user?.categories?.map(cat => cat._id) || []; // Get current IDs from user state

        // Determine categories to add (newly selected IDs not in current list)
        const categoriesToAdd = selectedCategoryIds.filter(id => !currentUserCategoryIds.includes(id));
        // Determine categories to remove (current IDs not in selected list)
        const categoriesToRemove = currentUserCategoryIds.filter(id => !selectedCategoryIds.includes(id));

        // Process additions using Promise.all for efficiency
        await Promise.all(categoriesToAdd.map(categoryId =>
          axios.post(`${API_URL}/categories/user`, { category_id: categoryId }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ));

        // Process removals using Promise.all
         await Promise.all(categoriesToRemove.map(categoryId =>
           // Ensure DELETE request uses categoryId in the URL path as per backend route
           axios.delete(`${API_URL}/categories/user/${categoryId}`, {
             headers: { Authorization: `Bearer ${token}` }
           })
         ));


        // 3. Refetch the updated profile from the backend to get the latest user data,
        // including the updated list of category objects with their labels and IDs.
        const updatedProfileResponse = await axios.get(`${API_URL}/user_auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update the user state with the fresh data
        setUser(updatedProfileResponse.data.user);
        // Update local storage as well
        localStorage.setItem('user', JSON.stringify(updatedProfileResponse.data.user));

        setEditOpen(false); // Close the dialog on success
        alert('Profil mis à jour avec succès'); // Provide feedback

      } catch (error) {
        console.error("Error updating profile:", error);
        // Display error message to the user
        alert(error.response?.data?.error || 'Une erreur est survenue lors de la mise à jour du profil');
        // You might want more specific error handling here
      } finally {
        setIsProfileSubmitting(false); // End submitting state
      }
    }
  });

  // Formik for password change - logic seems fine, only updating URL for consistency
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
        setIsPasswordSubmitting(true); // Start submitting state for password form
        const { data } = await axios.put(`${API_URL}/user_auth/change-password`, { // Corrected URL base
          current_password: values.currentPassword,
          new_password: values.newPassword
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert(data.message); // Show success message
        setPasswordOpen(false); // Close dialog
        resetForm(); // Clear form fields
      } catch (error) {
        console.error("Error changing password:", error);
        // Display error message
        alert(error.response?.data?.error || 'Une erreur est survenue lors du changement de mot de passe');
        // Optionally set specific field errors from backend validation
        if (error.response?.data?.error) {
             // Example: passwordFormik.setFieldError('currentPassword', error.response.data.error);
        }
      } finally {
         setIsPasswordSubmitting(false); // End submitting state
      }
    }
  });

  // Handle Logout - URL updated for consistency
   const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Call backend logout endpoint (optional, client-side token removal is key)
        await axios.post(`${API_URL}/user_auth/logout`, null, { // Corrected URL base
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Error during backend logout call:", error);
        // Continue with client-side logout even if backend call fails
      }
    }
    // Always remove tokens from client-side storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth'); // Redirect to login page
  };

  // Handle Admin Request - URL updated for consistency
  const handleAdminRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/auth'); // Ensure token exists

    try {
      // Call backend endpoint to request admin status
      const { data } = await axios.post(`${API_URL}/user_auth/demande-admin`, null, { // Corrected URL base
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert(data.message); // Show success message

      // Refetch profile to potentially show updated role or pending status
      const updatedProfileResponse = await axios.get(`${API_URL}/user_auth/profile`, { // Corrected URL base
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Update user state and local storage
      setUser(updatedProfileResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updatedProfileResponse.data.user));

    } catch (error) {
      console.error("Error requesting admin status:", error);
      // Display error message
      alert(error.response?.data?.error || 'Une erreur est survenue lors de la demande admin');
    }
  };


  // Dialog close handlers
  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => {
    setEditOpen(false);
    // Reset form values and errors when closing dialog
    profileFormik.resetForm();
    // Reset touched state manually as resetForm might not clear touched state
    profileFormik.setTouched({});
  };

  const handlePasswordOpen = () => setPasswordOpen(true);
  const handlePasswordClose = () => {
    setPasswordOpen(false);
    // Reset form values and errors when closing dialog
    passwordFormik.resetForm();
     // Reset touched state manually
    passwordFormik.setTouched({});
  };


  // Show loading spinner while initial data is being fetched
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6">Chargement du profil...</Typography>
      </Container>
    );
  }

  // Show error message if user data failed to load
  if (!user) return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 4 }}>
      {/* You might want a more specific error message here */}
      <Typography variant="h6">Impossible de charger le profil. Veuillez réessayer de vous connecter.</Typography>
       <Button variant="contained" sx={{mt: 2}} onClick={() => navigate('/auth')}>Aller à la connexion</Button>
    </Container>
  );

  // Main Profile JSX
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
        {/* User Info Display */}
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{
            bgcolor: deepPurple[500],
            width: 80,
            height: 80,
            fontSize: 32,
            mb: 2
          }}>
            {user.username?.charAt(0).toUpperCase()} {/* Display first letter of username */}
          </Avatar>

          <Typography variant="h5" fontWeight={600}>
            {user.username} {/* Display username */}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {user.email} {/* Display email */}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* User Details (Points, Categories, Role) */}
        <CardContent>
          <Stack spacing={2}>
            <Typography>
              <strong>Points :</strong> {user.points || 0} {/* Display points */}
            </Typography>

            <Typography>
              <strong>Catégories :</strong>
              {/* Display user's selected categories */}
              {user.categories?.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {/* Map over user's category objects to display Chip labels */}
                  {user.categories.map((cat) => (
                    <Chip key={cat._id || cat.label} label={cat.label || cat} size="small" /> // Use _id as key if available, fallback to label
                  ))}
                </Box>
              ) : 'Aucune catégorie sélectionnée'} {/* Handle case with no categories */}
            </Typography>

            <Typography>
              <strong>Rôle :</strong> {user.role || 'Utilisateur'} {/* Display user's role */}
            </Typography>
          </Stack>
        </CardContent>

        {/* Action Buttons */}
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

          {/* Conditionally render admin request button */}
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
              {/* Username Field */}
              <TextField
                fullWidth
                name="username"
                label="Nom d'utilisateur"
                value={profileFormik.values.username}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.username && !!profileFormik.errors.username}
                helperText={profileFormik.touched.username && profileFormik.errors.username}
                disabled={isProfileSubmitting} // Disable while submitting
              />

              {/* Email Field */}
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={profileFormik.values.email}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.email && !!profileFormik.errors.email}
                helperText={profileFormik.touched.email && profileFormik.errors.email}
                 disabled={isProfileSubmitting} // Disable while submitting
              />

              {/* Categories Select */}
              <FormControl fullWidth disabled={isProfileSubmitting}> {/* Disable while submitting */}
                <InputLabel>Catégories préférées</InputLabel>
                <Select
                  multiple
                  name="categories"
                  value={profileFormik.values.categories} // Formik value is array of IDs
                  onChange={profileFormik.handleChange}
                  // Render selected chip labels in the input
                   renderValue={(selectedIds) => ( // 'selectedIds' is the array from formik.values.categories
                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                       {selectedIds.map((id) => {
                          // Find the category object in categoriesList by ID to get the label for the Chip
                         const category = categoriesList.find(cat => cat._id === id);
                         // Use label from the category object or fallback to ID if not found (shouldn't happen if categoriesList is correct)
                         return <Chip key={id} label={category?.label || id} size="small" />;
                       })}
                     </Box>
                   )}
                >
                  {/* Render menu items with category objects from the fetched list */}
                  {categoriesList.map((category) => (
                    // The value of the MenuItem should be the category _id
                    <MenuItem key={category._id} value={category._id}>
                       {category.label} {/* Display the label in the dropdown */}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleEditClose} color="secondary" disabled={isProfileSubmitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isProfileSubmitting} // Disable button while submitting
            >
              {isProfileSubmitting ? ( // Show spinner when submitting
                <CircularProgress size={24} color="inherit" />
              ) : 'Enregistrer'}
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
                disabled={isPasswordSubmitting} // Disable while submitting
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
                 disabled={isPasswordSubmitting} // Disable while submitting
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
                 disabled={isPasswordSubmitting} // Disable while submitting
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handlePasswordClose} color="secondary" disabled={isPasswordSubmitting}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Enregistrer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Profile;
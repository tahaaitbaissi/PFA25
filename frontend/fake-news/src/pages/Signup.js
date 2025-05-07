// import { Box, Container, Paper, Typography, TextField, Button, Link } from '@mui/material';
// import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import { useState } from 'react';

// function Signup() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState({ username: '', email: '', password: '', points: 0 });

//   const handleChange = e => setUser({ ...user, [e.target.name]: e.target.value });

//   const handleSubmit = e => {
//     e.preventDefault();
//     const newUser = { ...user, id: Date.now() };
//     localStorage.setItem('user', JSON.stringify(newUser));
//     navigate('/signin');
//   };

//   return (
//     <Box
//       sx={{
//         backgroundImage: 'url("/images/fake-news.jpg")',
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         minHeight: '100vh',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       <Container maxWidth="sm">
//         <Paper elevation={6} sx={{ p: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' }}>
//           <Typography variant="h4" align="center" gutterBottom>
//             Créer un compte
//           </Typography>
//           <form onSubmit={handleSubmit}>
//             <TextField label="Nom d'utilisateur" name="username" fullWidth margin="normal" onChange={handleChange} required />
//             <TextField label="Adresse e-mail" name="email" type="email" fullWidth margin="normal" onChange={handleChange} required />
//             <TextField label="Mot de passe" name="password" type="password" fullWidth margin="normal" onChange={handleChange} required />
//             <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
//               S'inscrire
//             </Button>
//           </form>
//           <Typography variant="body2" align="center" sx={{ mt: 2 }}>
//             Vous avez déjà un compte ?{' '}
//             <Link component={RouterLink} to="/signin">
//               Se connecter
//             </Link>
//           </Typography>
//         </Paper>
//       </Container>
//     </Box>
//   );
// }

// export default Signup;

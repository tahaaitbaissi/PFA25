import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Alert } from '@mui/material';

function AdminRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.isAdmin) {
      navigate('/profile');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleRequest = () => {
    setRequested(true);
   
    console.log(`Demande d'admin envoyée par ${user.username}`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom>
          Devenir administrateur
        </Typography>
        {requested ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            Votre demande a été envoyée. Un administrateur vous contactera.
          </Alert>
        ) : (
          <>
            <Typography sx={{ my: 2 }}>
              Vous souhaitez devenir administrateur ? Cliquez ci-dessous pour envoyer votre demande.
            </Typography>
            <Button variant="contained" onClick={handleRequest}>
              Envoyer la demande
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default AdminRequest;

import React, { useState } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Button, 
  Tabs, 
  Tab, 
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box
} from '@mui/material';
import { Delete, CheckCircle, Add } from '@mui/icons-material';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null });
  const [newCategory, setNewCategory] = useState('');
  
  // Données initiales
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', isAdmin: false, adminRequest: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', isAdmin: true, adminRequest: false },
  ]);
  
  const [comments, setComments] = useState([
    { id: 1, content: 'Great article!', author: 'John Doe', article: 'Article 1' },
    { id: 2, content: 'Need more details', author: 'Jane Smith', article: 'Article 2' },
  ]);
  
  const [articles, setArticles] = useState([
    { id: 1, title: 'React Basics', author: 'John Doe', category: 'Technology' },
    { id: 2, title: 'Climate Change', author: 'Jane Smith', category: 'Science' },
  ]);
  
  const [categories, setCategories] = useState([
    { id: 1, name: 'Technology' },
    { id: 2, name: 'Science' },
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteConfirmation = (type, id) => {
    setDeleteTarget({ type, id });
    setOpenDialog(true);
  };

    const handleAdminReject = (userId) => {
    setUsers(users.map(user => 
        user.id === userId ? { ...user, adminRequest: false } : user
    ));
    };

  const handleDelete = () => {
    const { type, id } = deleteTarget;
    switch(type) {
      case 'user':
        setUsers(users.filter(user => user.id !== id));
        break;
      case 'comment':
        setComments(comments.filter(comment => comment.id !== id));
        break;
      case 'article':
        setArticles(articles.filter(article => article.id !== id));
        break;
      case 'category':
        setCategories(categories.filter(category => category.id !== id));
        break;
      default:
        break;
    }
    setOpenDialog(false);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { 
        id: Date.now(), 
        name: newCategory.trim() 
      }]);
      setNewCategory('');
    }
  };

  const handleAdminAccept = (userId) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isAdmin: true, adminRequest: false } : user
    ));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        Tableau de bord Administrateur
      </Typography>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="scrollable"
      >
        <Tab label="Utilisateurs" />
        <Tab label="Commentaires" />
        <Tab label="Articles" />
        <Tab label="Catégories" />
        <Tab label="Demandes Admin" />
      </Tabs>

      {/* Dialog de confirmation */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section Utilisateurs */}
      {tabValue === 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Gestion des utilisateurs</Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user.id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('user', user.id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={user.name}
                  secondary={`${user.email} | Admin: ${user.isAdmin ? 'Oui' : 'Non'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Section Commentaires */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Gestion des commentaires</Typography>
          <List>
            {comments.map((comment) => (
              <ListItem key={comment.id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('comment', comment.id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={comment.content}
                  secondary={`${comment.author} - ${comment.article}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Section Articles */}
      {tabValue === 2 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Gestion des articles</Typography>
          <List>
            {articles.map((article) => (
              <ListItem key={article.id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('article', article.id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={article.title}
                  secondary={`${article.author} - ${article.category}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Section Catégories */}
      {tabValue === 3 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Gestion des catégories</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              label="Nouvelle catégorie"
              variant="outlined"
              size="small"
            />
            <Button 
              onClick={handleAddCategory}
              variant="contained" 
              startIcon={<Add />}
            >
              Ajouter
            </Button>
          </Box>
          <List>
            {categories.map((category) => (
              <ListItem key={category.id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('category', category.id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

{/* Section Demandes Admin */}
{tabValue === 4 && (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>Demandes d'administration</Typography>
    <List>
      {users.filter(user => user.adminRequest).map((user) => (
        <ListItem key={user.id}
          secondaryAction={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleAdminAccept(user.id)}
              >
                Accepter
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleAdminReject(user.id)}
              >
                Rejeter
              </Button>
            </Box>
          }
          sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
        >
          <ListItemText
            primary={user.name}
            secondary={user.email}
          />
        </ListItem>
            ))}
            </List>
        </Paper>
        )}
    </Box>
  );
};

export default AdminDashboard;
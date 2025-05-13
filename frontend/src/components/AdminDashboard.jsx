import React, { useState, useEffect } from 'react';
import { 
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
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Delete, CheckCircle, Add } from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null });
  const [newCategory, setNewCategory] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for data
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);

  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Add request interceptor for auth token
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await api.get('/user_auth/profile');
        setIsAdmin(response.data.user?.role === 'admin');
        
        if (response.data.user?.role === 'admin') {
          fetchAdminData();
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, articlesRes, adminRequestsRes, categoriesRes] = await Promise.all([
        api.get('/admin_auth/users'),
        api.get('/admin_auth/articles'),
        api.get('/admin_auth/demandes-admin'),
        api.get('/categories/')
      ]);

      setUsers(usersRes.data);
      setArticles(articlesRes.data);
      setAdminRequests(adminRequestsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteConfirmation = (type, id) => {
    setDeleteTarget({ type, id });
    setOpenDialog(true);
  };

  const handleAdminReject = async (userId) => {
    try {
      await api.post(`/admin_auth/refuser-admin/${userId}`);
      setAdminRequests(adminRequests.filter(req => req._id !== userId));
      setUsers(users.map(user => 
        user._id === userId ? { ...user, adminRequest: false } : user
      ));
    } catch (err) {
      console.error('Error rejecting admin request:', err);
      setError('Failed to reject admin request');
    }
  };

  const handleDelete = async () => {
    const { type, id } = deleteTarget;
    try {
      switch(type) {
        case 'user':
          await api.put(`/admin_auth/users/${id}/suspend`);
          setUsers(users.filter(user => user._id !== id));
          break;
        case 'article':
          await api.delete(`/admin_auth/articles/${id}`);
          setArticles(articles.filter(article => article._id !== id));
          break;
        case 'category':
          await api.delete(`/categories/${id}`);
          setCategories(categories.filter(category => category._id !== id));
          break;
        default:
          break;
      }
      setOpenDialog(false);
    } catch (err) {
      console.error('Error deleting:', err);
      setError(`Failed to delete ${type}`);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const response = await api.post('/categories/', {
        label: newCategory.trim()
      });

      setCategories([...categories, {
        _id: response.data.category_id,
        label: newCategory.trim()
      }]);
      setNewCategory('');
    } catch (err) {
      console.error('Error adding category:', err);
      if (err.response?.status === 409) {
        setError('Category already exists');
      } else {
        setError('Failed to add category');
      }
    }
  };

  const handleAdminAccept = async (userId) => {
    try {
      await api.post(`/admin_auth/valider-admin/${userId}`);
      setAdminRequests(adminRequests.filter(req => req._id !== userId));
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isAdmin: true, adminRequest: false } : user
      ));
    } catch (err) {
      console.error('Error accepting admin request:', err);
      setError('Failed to accept admin request');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={80} />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600, margin: 'auto' }}>
          You don't have administrator privileges to access this page.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600, margin: 'auto' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="scrollable"
      >
        <Tab label="Users" />
        <Tab label="Articles" />
        <Tab label="Categories" />
        <Tab label="Admin Requests" />
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Users Section */}
      {tabValue === 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>User Management</Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user._id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('user', user._id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={user.username}
                  secondary={`${user.email} | Admin: ${user.role === 'admin' ? 'Yes' : 'No'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Articles Section */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Article Management</Typography>
          <List>
            {articles.map((article) => (
              <ListItem key={article._id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('article', article._id)}>
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

      {/* Categories Section */}
      {tabValue === 2 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Category Management</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              label="New Category"
              variant="outlined"
              size="small"
            />
            <Button 
              onClick={handleAddCategory}
              variant="contained" 
              startIcon={<Add />}
              disabled={!newCategory.trim()}
            >
              Add
            </Button>
          </Box>
          <List>
            {categories.map((category) => (
              <ListItem key={category._id}
                secondaryAction={
                  <IconButton onClick={() => handleDeleteConfirmation('category', category._id)}>
                    <Delete color="error" />
                  </IconButton>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={category.label} color="primary" size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ID: {category._id}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Admin Requests Section */}
      {tabValue === 3 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Admin Requests</Typography>
          <List>
            {adminRequests.map((user) => (
              <ListItem key={user._id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleAdminAccept(user._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleAdminReject(user._id)}
                    >
                      Reject
                    </Button>
                  </Box>
                }
                sx={{ backgroundColor: 'background.paper', mb: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={user.username}
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
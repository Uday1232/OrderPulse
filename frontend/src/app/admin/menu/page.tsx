'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { useStores } from '../../../hooks/useStores';
import { useMenu } from '../../../hooks/useMenu';
import { useDebounce } from '../../../hooks/useDebounce';

export default function MenuItemsManagementPage() {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Set initial store
  React.useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]!.id);
    }
  }, [stores, selectedStore]);

  const { allItems, categories, isLoading, isError, error, createItem, isCreatingItem } = useMenu(selectedStore);

  // Add Item Modal Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateItem = async () => {
    if (!itemName || !itemPrice) {
      setFormError('Please enter item name and price.');
      return;
    }

    setFormError(null);
    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('price', itemPrice);
      if (itemCategory) formData.append('category_name', itemCategory);
      if (itemDescription) formData.append('description', itemDescription);
      if (imageFile) formData.append('image', imageFile);

      await createItem(formData);
      setSuccessMsg(`Item "${itemName}" added to menu successfully!`);
      setItemName('');
      setItemPrice('');
      setItemCategory('');
      setItemDescription('');
      setImageFile(null);
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to create item. Admin authorization required.');
    }
  };

  const filteredItems = allItems.filter((item) =>
    !debouncedSearch || item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />

      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Menu Items
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Manage menu items, prices, categories, and photos
            </Typography>
          </Box>

          <Button
            onClick={() => setModalOpen(true)}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              py: 1.1,
              '&:hover': { backgroundColor: '#1E293B' },
            }}
          >
            Add Item
          </Button>
        </Box>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Filters Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
            backgroundColor: '#FFFFFF',
            p: 2,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Store Switcher */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search Bar */}
          <TextField
            size="small"
            placeholder="Search menu items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '0.85rem' },
            }}
            sx={{ flex: '1 1 200px' }}
          />
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {(error as Error)?.message || 'Failed to load menu items'}
          </Alert>
        )}

        {/* Menu Items Table matching Image 2 Screen 7 */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>ITEM NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>PRICE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item, idx) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        component="img"
                        src={item.image_url || '/images/food/burger.jpg'}
                        alt={item.name}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = '/images/food/burger.jpg';
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#F1F5F9',
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          Rating: {item.rating || 4.5} ★
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.category?.name || 'Main Menu'}
                      size="small"
                      sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', backgroundColor: '#F1F5F9' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                    ${Number(item.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      sx={{ color: '#3B82F6', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#EFF6FF' } }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Item Modal with Multer Photo Upload */}
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Add Menu Item
            </Typography>
            <IconButton size="small" onClick={() => setModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Item Name"
                placeholder="e.g. Avocado Toast Deluxe"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Price ($)"
                placeholder="12.99"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                fullWidth
                size="small"
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={itemCategory}
                  label="Category"
                  onChange={(e) => setItemCategory(e.target.value)}
                >
                  <MenuItem value="Main Menu">Main Menu</MenuItem>
                  <MenuItem value="Appetizer">Appetizer</MenuItem>
                  <MenuItem value="Beverages">Beverages</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Description"
                placeholder="Brief delicious description of the dish..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
              />

              {/* Photo Upload Input */}
              <Box
                sx={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  p: 2.5,
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                }}
                component="label"
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: '#64748B', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {imageFile ? imageFile.name : 'Click to select dish photo'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  PNG, JPG, or WEBP up to 5MB
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={isCreatingItem}
              variant="contained"
              sx={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}
            >
              {isCreatingItem ? <CircularProgress size={20} color="inherit" /> : 'Save Item'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

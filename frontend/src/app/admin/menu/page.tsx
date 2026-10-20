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
  Switch,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { AdminGuard } from '../../../components/auth/AdminGuard';
import { useStores } from '../../../hooks/useStores';
import { useMenu } from '../../../hooks/useMenu';
import { useDebounce } from '../../../hooks/useDebounce';
import { Item } from '../../../types/order';
import { getMediaUrl } from '../../../utils/imageUrl';

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

  const {
    allItems,
    categories,
    isLoading,
    isError,
    error,
    createItem,
    isCreatingItem,
    updateItem,
    isUpdatingItem,
    toggleItemActive,
  } = useMenu(selectedStore);

  // Add Item Modal Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Item Modal Form state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemActive, setEditItemActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);


  // Auto-select first available category when categories are fetched
  React.useEffect(() => {
    if (categories.length > 0 && !itemCategory) {
      setItemCategory(categories[0]!.id);
    }
  }, [categories, itemCategory]);

  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPrice) {
      setFormError('Please enter item name and price.');
      return;
    }

    setFormError(null);
    try {
      const formData = new FormData();
      formData.append('name', itemName.trim());
      formData.append('price', itemPrice);
      if (itemCategory) {
        formData.append('category_id', itemCategory);
        const matchedCategory = categories.find((c) => c.id === itemCategory);
        if (matchedCategory) {
          formData.append('category_name', matchedCategory.name);
        }
      }
      if (itemDescription) formData.append('description', itemDescription.trim());
      if (imageFile) formData.append('image', imageFile);

      await createItem(formData);
      setSuccessMsg(`Item "${itemName}" added to menu successfully!`);
      setItemName('');
      setItemPrice('');
      setItemCategory(categories[0]?.id || '');
      setItemDescription('');
      setImageFile(null);
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to create item. Admin authorization required.');
    }
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
    setEditItemCategory(item.category_id || item.category?.id || (categories[0]?.id || ''));
    setEditItemDescription(item.description || '');
    setEditItemActive(item.is_active !== false);
    setEditImageFile(null);
    setEditFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    if (!editItemName.trim() || !editItemPrice) {
      setEditFormError('Please enter item name and price.');
      return;
    }

    setEditFormError(null);
    try {
      if (editImageFile) {
        const formData = new FormData();
        formData.append('name', editItemName.trim());
        formData.append('price', editItemPrice);
        formData.append('description', editItemDescription.trim());
        if (editItemCategory) {
          formData.append('category_id', editItemCategory);
          const matchedCategory = categories.find((c) => c.id === editItemCategory);
          if (matchedCategory) {
            formData.append('category_name', matchedCategory.name);
          }
        }
        formData.append('is_active', String(editItemActive));
        formData.append('image', editImageFile);

        await updateItem({ itemId: editingItem.id, data: formData });
      } else {
        await updateItem({
          itemId: editingItem.id,
          data: {
            name: editItemName.trim(),
            price: Number(editItemPrice),
            description: editItemDescription.trim(),
            category_id: editItemCategory || undefined,
            is_active: editItemActive,
          },
        });
      }

      setSuccessMsg(`Item "${editItemName}" updated successfully!`);
      setEditModalOpen(false);
      setEditingItem(null);
    } catch (err: unknown) {
      setEditFormError((err as Error).message || 'Failed to update item.');
    }
  };


  const filteredItems = allItems.filter((item) =>
    !debouncedSearch || item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 4 }, overflowY: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' } }}>
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
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                '& .MuiSelect-select': { color: '#0F172A !important' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1 !important' },
                '& .MuiSvgIcon-root': { color: '#64748B' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#FFFFFF',
                    '& .MuiMenuItem-root': {
                      color: '#0F172A',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#F1F5F9' },
                    },
                  },
                },
              }}
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
                  <SearchIcon sx={{ color: '#64748B', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '10px',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                '& .MuiInputBase-input': { color: '#0F172A !important' },
                '& .MuiInputBase-input::placeholder': { color: '#64748B !important', opacity: 1 },
                '& fieldset': { borderColor: '#CBD5E1 !important' },
              },
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
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 600 }}>
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
                        src={getMediaUrl(item.image_url)}
                        alt={item.name}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = '/images/food/burger.jpg';
                        }}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          objectFit: 'cover',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
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
                      sx={{
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #E2E8F0',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                    ${Number(item.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.is_active !== false ? 'Click to deactivate item' : 'Click to activate item'}>
                      <Chip
                        label={item.is_active !== false ? 'Active' : 'Inactive'}
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const newStatus = !(item.is_active !== false);
                            await toggleItemActive(item.id, newStatus);
                            setSuccessMsg(`"${item.name}" marked as ${newStatus ? 'Active' : 'Inactive'}`);
                          } catch (err: unknown) {
                            setFormError((err as Error).message || 'Failed to toggle status');
                          }
                        }}
                        clickable
                        sx={{
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          backgroundColor: item.is_active !== false ? '#DCFCE7' : '#F1F5F9',
                          color: item.is_active !== false ? '#15803D' : '#64748B',
                          border: item.is_active !== false ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                          '&:hover': {
                            backgroundColor: item.is_active !== false ? '#BBF7D0' : '#E2E8F0',
                            transform: 'scale(1.05)',
                          },
                          transition: 'all 0.15s ease-in-out',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      onClick={() => handleOpenEdit(item)}
                      sx={{
                        color: '#3B82F6',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#EFF6FF' },
                      }}
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
          PaperProps={{
            sx: {
              borderRadius: '20px',
              p: 1,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0F172A', fontWeight: 800 }}>
            Add Menu Item
            <IconButton size="small" onClick={() => setModalOpen(false)} sx={{ color: '#64748B' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
            {formError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                }}
              >
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Item Name
                </Typography>
                <TextField
                  placeholder="e.g. Avocado Toast Deluxe"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiInputBase-input': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Price ($)
                </Typography>
                <TextField
                  placeholder="12.99"
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiInputBase-input': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Category
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiSelect-select': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#FFFFFF',
                          '& .MuiMenuItem-root': {
                            color: '#0F172A',
                            '&:hover': { backgroundColor: '#F1F5F9' },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select a category
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                    {categories.length === 0 && (
                      <MenuItem value="">Default Category</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Description
                </Typography>
                <TextField
                  placeholder="Brief delicious description of the dish..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiInputBase-input': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    },
                  }}
                />
              </Box>

              {/* Photo Upload Input */}
              <Box
                sx={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  p: 2.5,
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#FF7A00', backgroundColor: '#FFF7ED' },
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
                {imageFile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      sx={{ width: 70, height: 70, objectFit: 'cover', borderRadius: '10px', border: '2px solid #FF7A00' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {imageFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FF7A00', fontWeight: 600 }}>
                      Selected for upload (click to change)
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 32, color: '#64748B', mb: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      Click to select dish photo
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      PNG, JPG, or WEBP up to 5MB
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={isCreatingItem}
              variant="contained"
              sx={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.5,
                '&:hover': { backgroundColor: '#1E293B' },
              }}
            >
              {isCreatingItem ? <CircularProgress size={20} color="inherit" /> : 'Save Item'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Item Modal */}
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              p: 1,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0F172A', fontWeight: 800 }}>
            Edit Menu Item
            <IconButton size="small" onClick={() => setEditModalOpen(false)} sx={{ color: '#64748B' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
            {editFormError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                }}
              >
                {editFormError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Item Name
                </Typography>
                <TextField
                  placeholder="e.g. Avocado Toast Deluxe"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiInputBase-input': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Category
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={editItemCategory}
                      onChange={(e) => setEditItemCategory(e.target.value)}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiSelect-select': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: '#FFFFFF',
                            '& .MuiMenuItem-root': {
                              color: '#0F172A',
                              '&:hover': { backgroundColor: '#F1F5F9' },
                            },
                          },
                        },
                      }}
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                    Price ($)
                  </Typography>
                  <TextField
                    placeholder="9.99"
                    type="number"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      sx: {
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        '& .MuiInputBase-input': { color: '#0F172A !important' },
                        '& fieldset': { borderColor: '#CBD5E1' },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Description
                </Typography>
                <TextField
                  placeholder="Detailed description of taste, ingredients, or serving..."
                  value={editItemDescription}
                  onChange={(e) => setEditItemDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      '& .MuiInputBase-input': { color: '#0F172A !important' },
                      '& fieldset': { borderColor: '#CBD5E1' },
                    },
                  }}
                />
              </Box>

              {/* Active Toggle Switch */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Item Available on Menu
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    When active, customers and cashiers can add this item to orders
                  </Typography>
                </Box>
                <Switch
                  checked={editItemActive}
                  onChange={(e) => setEditItemActive(e.target.checked)}
                  color="success"
                />
              </Box>

              {/* Photo Upload */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.5, display: 'block' }}>
                  Update Dish Photo (Optional)
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#F8FAFC',
                    '&:hover': { borderColor: '#FF7A00', backgroundColor: '#FFF7ED' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  {editImageFile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box
                        component="img"
                        src={URL.createObjectURL(editImageFile)}
                        alt="Preview"
                        sx={{ width: 70, height: 70, objectFit: 'cover', borderRadius: '10px', border: '2px solid #FF7A00' }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {editImageFile.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#FF7A00', fontWeight: 600 }}>
                        New photo selected (click to change)
                      </Typography>
                    </Box>
                  ) : editingItem?.image_url ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box
                        component="img"
                        src={getMediaUrl(editingItem.image_url)}
                        alt={editingItem.name}
                        sx={{ width: 70, height: 70, objectFit: 'cover', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Click to replace current photo
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 32, color: '#64748B', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Click to select dish photo
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        PNG, JPG, or WEBP up to 5MB
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={isUpdatingItem}
              variant="contained"
              sx={{
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.5,
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              {isUpdatingItem ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
    </AdminGuard>
  );
}

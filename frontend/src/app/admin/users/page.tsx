'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Avatar,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { AdminSidebar } from '../../../components/admin/AdminSidebar';
import { AdminGuard } from '../../../components/auth/AdminGuard';
import { ApiService } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { Role } from '../../../types/order';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Admin Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credentials Result Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    plainPassword: string;
  } | null>(null);

  const generateAutoCredentials = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const email = `admin_${randomSuffix}@storepulse.com`;
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = 'Admin@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminEmail(email);
    setAdminPassword(pass);
  };

  const handleOpenAddModal = () => {
    setAdminName('');
    generateAutoCredentials();
    setErrorMsg(null);
    setAddModalOpen(true);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.getUsers();
      setUsers(res.data || []);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser: UserRecord) => {
    if (targetUser.id === currentUser?.id) {
      setErrorMsg('You cannot change your own active admin session.');
      return;
    }

    if (targetUser.role === 'SUPERADMIN' && currentUser?.role !== 'SUPERADMIN') {
      setErrorMsg('Only Superadmin can modify another Superadmin account.');
      return;
    }

    const nextRole: Role = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setErrorMsg(null);
    try {
      await ApiService.updateUserRole(targetUser.id, nextRole);
      setSuccessMsg(`Updated ${targetUser.name}'s role to ${nextRole === 'ADMIN' ? 'Store Admin' : 'Customer'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update user role.');
    }
  };

  const handleCreateAdmin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.createAdmin({
        name: adminName.trim() || undefined,
        email: adminEmail.trim() || undefined,
        password: adminPassword.trim() || undefined,
      });

      setCreatedCredentials({
        name: res.data.user.name,
        email: res.data.credentials.email,
        plainPassword: res.data.credentials.plainPassword,
      });

      setAddModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to create admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdCredentials) return;
    const text = `StorePulse Admin Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.plainPassword}\nLogin URL: http://localhost:3001/login`;
    navigator.clipboard.writeText(text);
    setSuccessMsg('Admin credentials copied to clipboard!');
  };

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 70px)', backgroundColor: '#F8FAFC' }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Staff & Role Management
                </Typography>
                {currentUser?.role === 'SUPERADMIN' ? (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                    label="👑 SuperAdmin Master"
                    size="small"
                    sx={{ backgroundColor: '#4338CA', color: '#FFFFFF', fontWeight: 800 }}
                  />
                ) : (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                    label="Store Admin"
                    size="small"
                    sx={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                Create store administrators with auto-generated credentials and control access permissions.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                onClick={fetchUsers}
                startIcon={<RefreshIcon />}
                variant="outlined"
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#F1F5F9' },
                }}
              >
                Refresh
              </Button>
              <Button
                onClick={handleOpenAddModal}
                variant="contained"
                startIcon={<PersonAddIcon />}
                sx={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 2.5,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                + Add Store Admin
              </Button>
            </Box>
          </Box>

          {/* Feedback messages */}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          {/* Info Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '14px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                Role Hierarchy & Security Model
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6' }}>
                • <strong>SuperAdmin</strong> controls all platform stores, managers, and system settings.
                <br />
                • <strong>Store Admins</strong> are created only through this portal with auto-generated credentials.
                <br />
                • <strong>Customers</strong> register publicly to order from menus.
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800 }}>
              {users.length} Registered Accounts
            </Typography>
          </Paper>

          {/* Users Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#0F172A' }} />
            </Box>
          ) : (
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
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>USER</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>EMAIL</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>ROLE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>JOINED DATE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', textAlign: 'right' }}>ROLE ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuper = u.role === 'SUPERADMIN';
                    const isAdmin = u.role === 'ADMIN';

                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                backgroundColor: isSuper ? '#4338CA' : isAdmin ? '#0F172A' : '#64748B',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                              }}
                            >
                              {u.name ? u.name[0]?.toUpperCase() : 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {u.name} {isSelf && '(You)'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                ID: #{u.id.slice(0, 8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#334155', fontWeight: 600 }}>{u.email}</TableCell>
                        <TableCell>
                          {isSuper ? (
                            <Chip
                              label="👑 SuperAdmin"
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                backgroundColor: '#EEF2FF',
                                color: '#4338CA',
                                border: '1px solid #C7D2FE',
                              }}
                            />
                          ) : isAdmin ? (
                            <Chip
                              icon={<AdminPanelSettingsIcon sx={{ fontSize: 16 }} />}
                              label="Store Admin"
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                backgroundColor: '#F1F5F9',
                                color: '#0F172A',
                                border: '1px solid #CBD5E1',
                              }}
                            />
                          ) : (
                            <Chip
                              icon={<PersonIcon sx={{ fontSize: 16 }} />}
                              label="Customer"
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                backgroundColor: '#F8FAFC',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          {isSelf ? (
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                              Active Session
                            </Typography>
                          ) : isSuper ? (
                            <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 700 }}>
                              Protected Master
                            </Typography>
                          ) : (
                            <Tooltip title={isAdmin ? 'Demote to regular Customer' : 'Promote to Store Admin'}>
                              <Button
                                size="small"
                                onClick={() => handleToggleRole(u)}
                                variant="outlined"
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  borderColor: isAdmin ? '#CBD5E1' : '#0F172A',
                                  color: isAdmin ? '#64748B' : '#0F172A',
                                  backgroundColor: isAdmin ? '#F8FAFC' : '#F1F5F9',
                                  '&:hover': {
                                    backgroundColor: isAdmin ? '#FEE2E2' : '#0F172A',
                                    color: isAdmin ? '#DC2626' : '#FFFFFF',
                                    borderColor: isAdmin ? '#FCA5A5' : '#0F172A',
                                  },
                                }}
                              >
                                {isAdmin ? 'Demote to Customer' : '👑 Make Admin'}
                              </Button>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Add Admin Modal with Auto-Generated Credentials */}
          <Dialog
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 1,
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
              },
            }}
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>
              Create New Store Admin
              <IconButton size="small" onClick={() => setAddModalOpen(false)} sx={{ color: '#64748B' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '0.82rem' }}>
                  Username and password are generated automatically. You can edit them or click regenerate at any time.
                </Alert>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block', fontSize: '0.8rem' }}>
                    Admin Name / Branch Description (Optional)
                  </Typography>
                  <TextField
                    placeholder="e.g. North Bistro Manager"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: '#CBD5E1', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#94A3B8' },
                        '&.Mui-focused fieldset': { borderColor: '#FF7A00', borderWidth: '2px' },
                      },
                      '& .MuiInputBase-input': {
                        color: '#0F172A !important',
                        WebkitTextFillColor: '#0F172A !important',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: '#94A3B8 !important',
                        WebkitTextFillColor: '#94A3B8 !important',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem' }}>
                      Auto-Generated Admin Email / Username
                    </Typography>
                    <Button
                      size="small"
                      onClick={generateAutoCredentials}
                      startIcon={<AutorenewIcon sx={{ fontSize: 14 }} />}
                      sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', color: '#4F46E5', p: 0 }}
                    >
                      Regenerate
                    </Button>
                  </Box>
                  <TextField
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: '#CBD5E1', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#94A3B8' },
                        '&.Mui-focused fieldset': { borderColor: '#FF7A00', borderWidth: '2px' },
                      },
                      '& .MuiInputBase-input': {
                        color: '#0F172A !important',
                        WebkitTextFillColor: '#0F172A !important',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block', fontSize: '0.8rem' }}>
                    Auto-Generated Secure Password
                  </Typography>
                  <TextField
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: '#64748B' }}>
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: '#CBD5E1', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#94A3B8' },
                        '&.Mui-focused fieldset': { borderColor: '#FF7A00', borderWidth: '2px' },
                      },
                      '& .MuiInputBase-input': {
                        color: '#0F172A !important',
                        WebkitTextFillColor: '#0F172A !important',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        letterSpacing: showPassword ? 'normal' : '0.1em',
                      },
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setAddModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={isSubmitting}
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
                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Create Admin'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Credentials Created Confirmation Dialog */}
          <Dialog
            open={Boolean(createdCredentials)}
            onClose={() => setCreatedCredentials(null)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 2,
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                textAlign: 'center',
              },
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#10B981', mx: 'auto', mt: 1, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Admin Account Created!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
              Share these credentials with the store manager:
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: '#F8FAFC',
                border: '1.5px dashed #CBD5E1',
                borderRadius: '14px',
                textAlign: 'left',
                mb: 2.5,
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                ADMIN USERNAME / EMAIL
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                {createdCredentials?.email}
              </Typography>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                GENERATED PASSWORD
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {createdCredentials?.plainPassword}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                onClick={copyCredentialsToClipboard}
                startIcon={<ContentCopyIcon />}
                fullWidth
                sx={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  py: 1.1,
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                Copy Credentials
              </Button>
              <Button
                onClick={() => setCreatedCredentials(null)}
                sx={{ color: '#64748B', fontWeight: 600 }}
              >
                Done
              </Button>
            </Box>
          </Dialog>
        </Box>
      </Box>
    </AdminGuard>
  );
}

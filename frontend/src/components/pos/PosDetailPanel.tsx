'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Rating,
  Stack,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Item } from '../../types/order';
import { useCartStore } from '../../store/useCartStore';

interface PosDetailPanelProps {
  item: Item | null;
  onClose?: () => void;
}

const INGREDIENTS = [
  { name: 'Carrot', emoji: '🥕', color: '#FFF7ED', border: '#FED7AA' },
  { name: 'Lettuce', emoji: '🥬', color: '#F0FDF4', border: '#BBF7D0' },
  { name: 'Tomato', emoji: '🍅', color: '#FEF2F2', border: '#FECACA' },
  { name: 'Cucumber', emoji: '🥒', color: '#ECFDF5', border: '#A7F3D0' },
];

export function PosDetailPanel({ item, onClose }: PosDetailPanelProps) {
  const {
    inspectionQty,
    incrementInspectionQty,
    decrementInspectionQty,
    addItem,
  } = useCartStore();

  if (!item) {
    return (
      <Box
        sx={{
          width: 380,
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#94A3B8',
        }}
      >
        <ShoppingBagOutlinedIcon sx={{ fontSize: 56, mb: 1.5, opacity: 0.4 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569', mb: 0.5 }}>
          Item Inspection
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: 220 }}>
          Click any menu item from the catalog to inspect ingredients and customize order.
        </Typography>
      </Box>
    );
  }

  const originalPrice = (item.price * 1.35).toFixed(2);
  const totalItemAmount = (item.price * inspectionQty).toFixed(2);

  const handleAddToCart = () => {
    addItem(item, inspectionQty);
  };

  return (
    <Box
      sx={{
        width: 380,
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto',
      }}
    >
      <Box>
        {/* Top Header / Close (mobile) */}
        {onClose && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        {/* Enlarged Food Photo */}
        <Box
          sx={{
            width: '100%',
            height: 220,
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box
            component="img"
            src={item.image_url || '/images/food/sandwich.jpg'}
            alt={item.name}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = '/images/food/sandwich.jpg';
            }}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>

        {/* Title & Price Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                lineHeight: 1.25,
                fontSize: '1.2rem',
              }}
            >
              {item.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.5 }}>
              <Rating
                value={item.rating || 4.8}
                precision={0.5}
                size="small"
                readOnly
                sx={{
                  '& .MuiRating-iconFilled': { color: '#F59E0B' },
                  fontSize: '0.95rem',
                }}
              />
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                {item.rating || 4.8}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#FF7A00',
                fontSize: '1.35rem',
              }}
            >
              ${Number(item.price).toFixed(2)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                textDecoration: 'line-through',
                color: '#94A3B8',
                display: 'block',
              }}
            >
              ${originalPrice}
            </Typography>
          </Box>
        </Box>

        {/* About Description */}
        <Box sx={{ my: 2.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#334155',
              mb: 0.8,
              fontSize: '0.9rem',
            }}
          >
            About Description:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              lineHeight: 1.6,
              fontSize: '0.85rem',
            }}
          >
            {item.description ||
              'This delectable creation features a medley of fresh, garden-fresh vegetables, savory herbs, and zesty condiments, all nestled between perfectly toasted artisanal bread. Savor the essence of pure taste in every bite!'}
          </Typography>
        </Box>

        {/* Ingredients Visual Chips */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#334155',
              mb: 1.2,
              fontSize: '0.9rem',
            }}
          >
            Ingredients:
          </Typography>
          <Stack direction="row" spacing={1.2}>
            {INGREDIENTS.map((ing) => (
              <Box
                key={ing.name}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.2,
                  borderRadius: '14px',
                  backgroundColor: ing.color,
                  border: `1px solid ${ing.border}`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>
                  {ing.emoji}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: '#475569',
                    fontSize: '0.7rem',
                    mt: 0.5,
                  }}
                >
                  {ing.name}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Bottom Controls: Stepper & Add-To-Cart Button */}
      <Box sx={{ pt: 2, borderTop: '1px solid #E2E8F0' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Stepper */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFF7ED',
              borderRadius: '30px',
              border: '1px solid #FFEDD5',
              p: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={decrementInspectionQty}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#FFFFFF',
                color: '#FF7A00',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                '&:hover': { backgroundColor: '#FFEDD5' },
              }}
            >
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <Typography
              sx={{
                fontWeight: 700,
                color: '#9A3412',
                px: 1.8,
                fontSize: '1rem',
              }}
            >
              {inspectionQty}
            </Typography>

            <IconButton
              size="small"
              onClick={incrementInspectionQty}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#FF7A00',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(255,122,0,0.3)',
                '&:hover': { backgroundColor: '#E06500' },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Add-To-Cart Action */}
          <Button
            onClick={handleAddToCart}
            fullWidth
            sx={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              py: 1.4,
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(255, 122, 0, 0.35)',
              '&:hover': {
                backgroundColor: '#E06500',
                boxShadow: '0 6px 20px rgba(255, 122, 0, 0.45)',
              },
            }}
          >
            Add-To-Cart (${totalItemAmount})
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

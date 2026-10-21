'use client';

import React from 'react';
import { Box, Typography, Card, IconButton, Rating } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Item } from '../../types/order';
import { useCartStore } from '../../store/useCartStore';
import { getMediaUrl } from '../../utils/imageUrl';

interface PosItemCardProps {
  item: Item;
  isSelected: boolean;
  onInspect: (item: Item) => void;
}

export function PosItemCard({ item, isSelected, onInspect }: PosItemCardProps) {
  const { addItem, updateQty, getItemQtyInCart } = useCartStore();
  const qtyInCart = getItemQtyInCart(item.id);

  // Original price for discount illusion matching reference design
  const originalPrice = (item.price * 1.35).toFixed(2);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQty(item.id, -1);
  };

  return (
    <Card
      onClick={() => onInspect(item)}
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: isSelected ? '2px solid #FF7A00' : '1px solid #E2E8F0',
        p: 2.5,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'all 0.25s ease',
        boxShadow: isSelected
          ? '0 10px 25px rgba(255, 122, 0, 0.18)'
          : '0 4px 16px rgba(0, 0, 0, 0.04)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* Item Image */}
      <Box
        sx={{
          width: '100%',
          height: 140,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
        }}
      >
        <Box
          component="img"
          src={getMediaUrl(item.image_url, '/images/food/burger.jpg')}
          alt={item.name}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '/images/food/burger.jpg';
          }}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '12px',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
      </Box>

      {/* Item Title */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: '#1E293B',
          lineHeight: 1.3,
          height: 42,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '0.95rem',
          mb: 0.8,
        }}
      >
        {item.name}
      </Typography>

      {/* Rating Stars */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.2 }}>
        <Rating
          value={item.rating || 4.5}
          precision={0.5}
          size="small"
          readOnly
          sx={{
            '& .MuiRating-iconFilled': {
              color: '#F59E0B',
            },
            fontSize: '1rem',
          }}
        />
        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
          {item.rating || 4.5}
        </Typography>
      </Box>

      {/* Price with Discount */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.8 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: '#FF7A00',
            fontSize: '1.25rem',
          }}
        >
          ₹{Number(item.price).toFixed(2)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            textDecoration: 'line-through',
            color: '#94A3B8',
            fontWeight: 500,
          }}
        >
          ₹{originalPrice}
        </Typography>
      </Box>

      {/* Quantity Stepper Pill */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFF7ED',
          border: '1px solid #FFEDD5',
          borderRadius: '30px',
          px: 1,
          py: 0.4,
          minWidth: 105,
        }}
      >
        <IconButton
          size="small"
          onClick={handleDecrement}
          disabled={qtyInCart === 0}
          sx={{
            color: qtyInCart === 0 ? '#CBD5E1' : '#EA580C',
            p: 0.3,
            '&:hover': { backgroundColor: '#FFEDD5' },
          }}
        >
          <RemoveIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: '#9A3412',
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {qtyInCart}
        </Typography>

        <IconButton
          size="small"
          onClick={handleIncrement}
          sx={{
            color: '#EA580C',
            p: 0.3,
            '&:hover': { backgroundColor: '#FFEDD5' },
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Card>
  );
}

'use client';

import React from 'react';
import { Box, Typography, Button, Stack, Divider } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';

interface CategoryNavSection {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    categoryGroup: 'Main Menu' | 'Appetizer' | 'Beverages';
  }>;
}

const CATEGORY_SECTIONS: CategoryNavSection[] = [
  {
    title: 'MAIN MENU',
    items: [
      { id: 'all-main', label: 'Veg. Mania', icon: <LunchDiningIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Main Menu' },
      { id: 'sandwich', label: 'Sandwich', icon: <FastfoodIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Main Menu' },
      { id: 'club-veg', label: 'Club Veg.', icon: <RestaurantIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Main Menu' },
      { id: 'pizza', label: 'Veg. Pizza', icon: <LocalPizzaIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Main Menu' },
    ],
  },
  {
    title: 'APPETIZER',
    items: [
      { id: 'burger', label: 'Burger', icon: <LunchDiningIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Appetizer' },
      { id: 'macaroni', label: 'Macaroni', icon: <SoupKitchenIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Appetizer' },
      { id: 'french-fries', label: 'French Fries', icon: <FastfoodIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Appetizer' },
    ],
  },
  {
    title: 'BEVERAGES',
    items: [
      { id: 'hot-coffee', label: 'Hot-Coffee', icon: <CoffeeIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Beverages' },
      { id: 'ice-tea', label: 'Ice-Tea', icon: <LocalCafeIcon sx={{ fontSize: 18 }} />, categoryGroup: 'Beverages' },
    ],
  },
];

interface PosSidebarProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export function PosSidebar({ selectedCategory, onSelectCategory }: PosSidebarProps) {
  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        display: { xs: 'none', lg: 'flex' },
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        borderRight: '1px solid #E2E8F0',
        minHeight: '100%',
        p: 2.5,
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      {/* Brand Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#FF7A00',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
          }}
        >
          <RestaurantIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1E293B',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Café
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
            POS Terminal
          </Typography>
        </Box>
      </Box>

      {/* Category Navigation Sections */}
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        {CATEGORY_SECTIONS.map((section) => (
          <Box key={section.title}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '0.08em',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                px: 1,
                mb: 1,
                display: 'block',
              }}
            >
              {section.title}
            </Typography>

            <Stack spacing={0.8}>
              {section.items.map((item) => {
                const isActive =
                  selectedCategory === item.label ||
                  (selectedCategory === 'All' && item.label === 'Veg. Mania') ||
                  selectedCategory === item.categoryGroup;

                return (
                  <Button
                    key={item.id}
                    onClick={() => onSelectCategory(item.label)}
                    startIcon={
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          backgroundColor: isActive ? '#FFFFFF' : '#F1F5F9',
                          color: isActive ? '#FF7A00' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {item.icon}
                      </Box>
                    }
                    sx={{
                      justifyContent: 'flex-start',
                      px: 1.5,
                      py: 1,
                      borderRadius: '12px',
                      backgroundColor: isActive ? '#FF7A00' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.875rem',
                      boxShadow: isActive ? '0 4px 14px rgba(255, 122, 0, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#E06500' : '#F8FAFC',
                        color: isActive ? '#FFFFFF' : '#0F172A',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

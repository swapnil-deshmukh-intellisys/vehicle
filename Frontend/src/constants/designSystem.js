/**
 * Design System - Color Palette
 * Centralized color system for consistent theming across the application
 */

export const ColorPalette = {
  // Primary Brand Colors (Red-Orange gradient - Main CTA, Primary actions)
  primary: {
    from: 'red-500',
    to: 'orange-500',
    gradient: 'from-red-500 to-orange-500',
    solid: 'red-600',
    hover: {
      from: 'red-600',
      to: 'orange-600',
      gradient: 'from-red-600 to-orange-600',
    },
    button: {
      from: 'red-700',
      to: 'red-800',
      gradient: 'from-red-700 to-red-800',
      hover: {
        from: 'red-800',
        to: 'red-900',
        gradient: 'from-red-800 to-red-900',
      }
    }
  },

  // Secondary Colors (Blue-Cyan gradient - Secondary actions, info)
  secondary: {
    from: 'blue-500',
    to: 'cyan-500',
    gradient: 'from-blue-500 to-cyan-500',
    solid: 'blue-600',
    hover: {
      from: 'blue-600',
      to: 'cyan-600',
      gradient: 'from-blue-600 to-cyan-600',
    },
    outline: {
      border: 'border-cyan-400',
      text: 'text-cyan-400',
      hover: {
        bg: 'hover:bg-cyan-400',
        text: 'hover:text-black',
      }
    }
  },

  // Success Colors (Green-Emerald gradient - Success states, positive actions)
  success: {
    from: 'green-500',
    to: 'emerald-500',
    gradient: 'from-green-500 to-emerald-500',
    solid: 'green-600',
    hover: {
      from: 'green-600',
      to: 'emerald-600',
      gradient: 'from-green-600 to-emerald-600',
    }
  },

  // Warning Colors (Yellow-Amber gradient - Warnings, highlights)
  warning: {
    from: 'yellow-500',
    to: 'amber-500',
    gradient: 'from-yellow-500 to-amber-500',
    solid: 'yellow-500',
    hover: {
      from: 'yellow-600',
      to: 'amber-600',
      gradient: 'from-yellow-600 to-amber-600',
    }
  },

  // Danger/Alert Colors (Orange-Red gradient - Alerts, urgent actions)
  danger: {
    from: 'orange-500',
    to: 'red-500',
    gradient: 'from-orange-500 to-red-500',
    solid: 'red-600',
    hover: {
      from: 'orange-600',
      to: 'red-600',
      gradient: 'from-orange-600 to-red-600',
    }
  },

  // Accent Colors (Purple-Pink gradient - Accent elements, special features)
  accent: {
    from: 'purple-500',
    to: 'pink-500',
    gradient: 'from-purple-500 to-pink-500',
    solid: 'purple-600',
    hover: {
      from: 'purple-600',
      to: 'pink-600',
      gradient: 'from-purple-600 to-pink-600',
    }
  },

  // Info Colors (Indigo-Purple gradient - Information, additional features)
  info: {
    from: 'indigo-500',
    to: 'purple-500',
    gradient: 'from-indigo-500 to-purple-500',
    solid: 'indigo-600',
    hover: {
      from: 'indigo-600',
      to: 'purple-600',
      gradient: 'from-indigo-600 to-purple-600',
    }
  },

  // Vehicle Type Specific Colors
  vehicleTypes: {
    twoWheeler: {
      from: 'green-400',
      to: 'cyan-500',
      gradient: 'from-green-400 to-cyan-500',
    },
    fourWheeler: {
      from: 'blue-400',
      to: 'purple-500',
      gradient: 'from-blue-400 to-purple-500',
    },
    threeWheeler: {
      from: 'yellow-400',
      to: 'orange-500',
      gradient: 'from-yellow-400 to-orange-500',
    },
    sixWheeler: {
      from: 'red-400',
      to: 'pink-500',
      gradient: 'from-red-400 to-pink-500',
    }
  },

  // Service Category Colors
  services: {
    garage: {
      gradient: 'from-red-500 to-orange-500',
      from: 'red-500',
      to: 'orange-500',
    },
    washing: {
      gradient: 'from-blue-500 to-cyan-500',
      from: 'blue-500',
      to: 'cyan-500',
    },
    buySell: {
      gradient: 'from-green-500 to-emerald-500',
      from: 'green-500',
      to: 'emerald-500',
    },
    rent: {
      gradient: 'from-purple-500 to-pink-500',
      from: 'purple-500',
      to: 'pink-500',
    },
    evService: {
      gradient: 'from-yellow-500 to-amber-500',
      from: 'yellow-500',
      to: 'amber-500',
    },
    emergency: {
      gradient: 'from-orange-500 to-red-500',
      from: 'orange-500',
      to: 'red-500',
    }
  },

  // Benefit/Feature Colors (for WhyChooseUs section)
  benefits: {
    verified: {
      gradient: 'from-blue-500 to-cyan-500',
    },
    pricing: {
      gradient: 'from-green-500 to-emerald-500',
    },
    vehicleTypes: {
      gradient: 'from-purple-500 to-pink-500',
    },
    updates: {
      gradient: 'from-orange-500 to-red-500',
    },
    reviews: {
      gradient: 'from-yellow-500 to-amber-500',
    },
    support: {
      gradient: 'from-indigo-500 to-purple-500',
    }
  }
};

// Helper function to get gradient class
export const getGradientClass = (colorKey, type = 'gradient') => {
  const colorMap = {
    primary: ColorPalette.primary,
    secondary: ColorPalette.secondary,
    success: ColorPalette.success,
    warning: ColorPalette.warning,
    danger: ColorPalette.danger,
    accent: ColorPalette.accent,
    info: ColorPalette.info,
  };

  const color = colorMap[colorKey];
  if (!color) return 'from-gray-500 to-gray-600';

  if (type === 'gradient') {
    return color.gradient;
  } else if (type === 'hover') {
    return color.hover?.gradient || color.gradient;
  }
  return color.gradient;
};

// Helper function to get button classes
export const getButtonClasses = (variant = 'primary', size = 'md') => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-2.5 px-5 text-sm sm:text-base',
    lg: 'py-3 px-6 text-base md:text-lg',
  };

  const variantClasses = {
    primary: `bg-gradient-to-r ${ColorPalette.primary.button.gradient} hover:${ColorPalette.primary.button.hover.gradient} text-white focus:ring-red-500`,
    secondary: `border-2 border-${ColorPalette.secondary.outline.border} text-${ColorPalette.secondary.outline.text} hover:bg-${ColorPalette.secondary.outline.hover.bg} hover:text-${ColorPalette.secondary.outline.hover.text} focus:ring-cyan-400`,
    outline: `border-2 border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-500`,
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.primary}`;
};

// Background gradient utilities
export const BackgroundGradients = {
  light: {
    primary: 'bg-gradient-to-br from-white to-blue-50/30',
    secondary: 'bg-gradient-to-br from-gray-50 to-blue-50/30',
    neutral: 'bg-white',
  },
  dark: {
    primary: 'bg-gradient-to-br from-gray-900 to-blue-900/20',
    secondary: 'bg-gradient-to-br from-gray-900 to-gray-800',
    neutral: 'bg-black',
  }
};

// Text color utilities
export const TextColors = {
  light: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-600',
    light: 'text-gray-400',
  },
  dark: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    light: 'text-gray-500',
  }
};

// Background color utilities
export const BackgroundColors = {
  light: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    muted: 'bg-gray-100',
  },
  dark: {
    primary: 'bg-gray-800',
    secondary: 'bg-gray-900',
    muted: 'bg-black',
  }
};

export default ColorPalette;


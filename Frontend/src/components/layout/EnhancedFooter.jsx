import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
  FaTwitter, 
  FaFacebook, 
  FaInstagram, 
  FaYoutube,
  FaLinkedin
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const EnhancedFooter = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNavClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      console.log('Subscribing email:', email);
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerSections = [
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Services', path: '/services' },
        { name: 'Careers', path: '/careers' },
        { name: 'Press', path: '/press' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', path: '/help' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
      ]
    },
    {
      title: 'Services',
      links: [
        { name: 'Garage Services', path: '/garage' },
        { name: 'Car Wash', path: '/wash' },
        { name: 'EV Services', path: '/ev' },
        { name: 'Roadside Assist', path: '/rsa' },
      ]
    }
  ];

  const socialLinks = [
    { icon: FaFacebook, href: '#', label: 'Facebook' },
    { icon: FaTwitter, href: '#', label: 'Twitter' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaYoutube, href: '#', label: 'YouTube' },
    { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
  ];

  const contactInfo = [
    {
      icon: PhoneIcon,
      text: '+91 98765 43210',
      href: 'tel:+919876543210'
    },
    {
      icon: EnvelopeIcon,
      text: 'support@servx24.com',
      href: 'mailto:support@servx24.com'
    },
    {
      icon: MapPinIcon,
      text: 'Pune, Maharashtra 411001',
      href: '#'
    },
    {
      icon: ClockIcon,
      text: 'Mon-Sat: 9AM-8PM',
      href: '#'
    }
  ];

  return (
    <footer className={`
      ${theme === 'light' 
        ? 'bg-gray-50 text-gray-900 border-t border-gray-200' 
        : 'bg-gray-900 text-white border-t border-gray-800'
      }
    `}>
      {/* Newsletter Section */}
      <div className={`
        ${theme === 'light' ? 'bg-blue-600' : 'bg-blue-800'}
        text-white py-8
      `}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
              <p className="text-blue-100">Get the latest updates on our services and offers</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div 
              onClick={handleHomeClick}
              className="cursor-pointer inline-block mb-4"
            >
              <h1 className="text-2xl font-bold text-blue-600">ServX24</h1>
            </div>
            <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              Elevating vehicle maintenance through innovation, quality service, and community connection. 
              Your trusted partner for all automotive needs.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3 mb-6">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                      ${theme === 'light'
                        ? 'bg-gray-200 text-gray-600 hover:bg-blue-600 hover:text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <a
                    key={index}
                    href={info.href}
                    className={`
                      flex items-center space-x-2 text-sm transition-colors duration-200
                      ${theme === 'light' ? 'text-gray-600 hover:text-blue-600' : 'text-gray-400 hover:text-blue-400'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{info.text}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className={`font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={() => handleNavClick(link.path)}
                      className={`
                        text-sm transition-colors duration-200 hover:text-blue-600
                        ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                      `}
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={`
          mt-12 pt-8 border-t
          ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}
        `}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className={`text-sm mb-4 md:mb-0 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              © 2024 ServX24. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`
                  p-2 rounded-full transition-colors duration-200
                  ${theme === 'light'
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 hover:bg-gray-800'
                  }
                `}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <button
                onClick={scrollToTop}
                className={`
                  p-2 rounded-full transition-colors duration-200
                  ${theme === 'light'
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 hover:bg-gray-800'
                  }
                `}
                aria-label="Scroll to top"
              >
                <ChevronUpIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`
        py-4 text-center text-xs
        ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-gray-400'}
      `}>
        <p>Made with ❤️ in India | Serving customers nationwide</p>
      </div>
    </footer>
  );
};

export default EnhancedFooter;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from '../components/context/ThemeContext';
import { ColorPalette, BackgroundGradients } from '../constants/designSystem';
import {
  faMapMarkerAlt, faPhone, faEnvelope, faClock,
  faCheck, faPaperPlane,
  faQuestionCircle, faChevronDown, faChevronUp, faAmbulance,
  faComments
} from '@fortawesome/free-solid-svg-icons';

const ContactUs = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedCity, setSelectedCity] = useState(sessionStorage.getItem('selectedCity') || 'Pune');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const faqItems = [
    {
      question: "What are your business hours?",
      answer: "We're available Monday to Saturday from 9:00 AM to 6:00 PM. Our support team responds to emails within 24 hours."
    },
    {
      question: "How long does bike servicing take?",
      answer: "Standard service takes 2-3 hours, while comprehensive service may take 4-6 hours. We offer express options for basic maintenance."
    },
    {
      question: "Do you offer home service?",
      answer: "Yes, we provide home service for bike repairs and maintenance in select areas. Additional charges may apply based on location."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cash, credit/debit cards, UPI payments, and all major digital wallets for your convenience."
    },
    {
      question: "Do you sell genuine spare parts?",
      answer: "Absolutely! We only use genuine and high-quality spare parts with warranties for all our repairs and services."
    }
  ];

  const contactMethods = [
    {
      icon: faMapMarkerAlt,
      title: "Visit Our Store",
      details: "Near, Hinjawadi - Wakad Rd, opp. Vijay Sales, Pune, Maharashtra, 2220011",
      description: "Come visit us for a test ride or consultation",
      gradient: ColorPalette.primary.gradient
    },
    {
      icon: faPhone,
      title: "Call Us",
      details: "+91 9112025454",
      description: "Mon-Sat: 9AM - 6PM | Sun: Closed",
      gradient: ColorPalette.secondary.gradient
    },
    {
      icon: faEnvelope,
      title: "Email Us",
      details: "info@servx24.com",
      description: "We'll respond within 24 hours",
      gradient: ColorPalette.warning.gradient
    },
    {
      icon: faClock,
      title: "Business Hours",
      details: "Monday - Saturday",
      description: "9:00 AM - 6:00 PM",
      gradient: ColorPalette.accent.gradient
    }
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
      <Header 
        selectedCity={selectedCity} 
        onCityChange={setSelectedCity}
      />

      {/* Hero Section - Commented out for now */}
      {/* <section className={`relative -mt-16 py-12 md:py-16 lg:py-20 px-4 flex items-center justify-center overflow-hidden ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            <span className={`bg-gradient-to-r ${ColorPalette.primary.gradient} bg-clip-text text-transparent`}>
              Connect
            </span>
            <br />
            <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>With ServX24</span>
          </h1>
          <p className={`text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            We're here to help you with all your vehicle needs. Get in touch with our team of experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <a 
              href="#contact-form"
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
            >
              <span className="relative z-10">Send Message</span>
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
            </a>
          </div>
        </div>
      </section> */}

      {/* Contact Methods Section */}
      <section className={`pt-4 pb-12 md:pt-6 md:pb-16 lg:pt-8 lg:pb-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.neutral : BackgroundGradients.dark.neutral}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Multiple Ways to Connect
            </h2>
            <p className={`text-sm md:text-base lg:text-lg ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Choose your preferred method to reach out to us
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {contactMethods.map((method, index) => (
              <div 
                key={index} 
                className={`group relative rounded-2xl p-6 text-center transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                  theme === 'light' 
                    ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                    : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                }`}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className="flex justify-center mb-4 flex-shrink-0 relative z-10">
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${method.gradient} shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                    <FontAwesomeIcon 
                      icon={method.icon} 
                      className="text-2xl text-white" 
                    />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-3 flex-shrink-0 relative z-10 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {method.title}
                </h3>
                <p className={`text-base font-semibold mb-2 bg-gradient-to-r ${method.gradient} bg-clip-text text-transparent relative z-10`}>
                  {method.details}
                </p>
                <p className={`text-sm md:text-base leading-relaxed relative z-10 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {method.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-center mb-8 md:mb-12 border-b">
            <div className="flex space-x-1">
              <button 
                className={`px-6 py-3 md:px-8 md:py-4 rounded-t-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'contact'
                    ? `bg-gradient-to-r ${ColorPalette.primary.gradient} text-white shadow-lg`
                    : theme === 'light' 
                      ? 'text-gray-600 hover:text-red-600' 
                      : 'text-gray-400 hover:text-red-400'
                }`}
                onClick={() => setActiveTab('contact')}
              >
                <FontAwesomeIcon icon={faEnvelope} />
                Contact Form
              </button>
              <button 
                className={`px-6 py-3 md:px-8 md:py-4 rounded-t-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'faq'
                    ? `bg-gradient-to-r ${ColorPalette.primary.gradient} text-white shadow-lg`
                    : theme === 'light' 
                      ? 'text-gray-600 hover:text-red-600' 
                      : 'text-gray-400 hover:text-red-400'
                }`}
                onClick={() => setActiveTab('faq')}
              >
                <FontAwesomeIcon icon={faQuestionCircle} />
                FAQ
              </button>
            </div>
          </div>
          
          <div className="tab-content">
            {/* Contact Form */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8" id="contact-form">
                <div className="lg:col-span-2">
                  <div className={`rounded-2xl p-6 md:p-8 ${
                    theme === 'light' 
                      ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                      : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                  }`}>
                    <div className="text-center mb-6 md:mb-8">
                      <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Send us a Message
                      </h3>
                      <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Fill out the form below and we'll get back to you as soon as possible
                      </p>
                    </div>
                    
                    {isSubmitted ? (
                      <div className="text-center py-12 md:py-16">
                        <FontAwesomeIcon icon={faCheck} className="text-green-500 text-5xl md:text-6xl mb-4" />
                        <h3 className={`text-xl md:text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          Thank You for Your Message!
                        </h3>
                        <p className={`text-sm md:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          We've received your inquiry and will respond within 24 hours.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div>
                            <label htmlFor="name" className={`block mb-2 font-medium text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                                theme === 'light' 
                                  ? 'bg-white border-gray-300 text-gray-900' 
                                  : 'bg-gray-900 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className={`block mb-2 font-medium text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                                theme === 'light' 
                                  ? 'bg-white border-gray-300 text-gray-900' 
                                  : 'bg-gray-900 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div>
                            <label htmlFor="phone" className={`block mb-2 font-medium text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                                theme === 'light' 
                                  ? 'bg-white border-gray-300 text-gray-900' 
                                  : 'bg-gray-900 border-gray-700 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label htmlFor="subject" className={`block mb-2 font-medium text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                              Subject
                            </label>
                            <select
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleInputChange}
                              required
                              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                                theme === 'light' 
                                  ? 'bg-white border-gray-300 text-gray-900' 
                                  : 'bg-gray-900 border-gray-700 text-white'
                              }`}
                            >
                              <option value="">Select a subject</option>
                              <option value="service">Bike Service</option>
                              <option value="sales">Product Sales</option>
                              <option value="repair">Repair Inquiry</option>
                              <option value="parts">Spare Parts</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="message" className={`block mb-2 font-medium text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            Message
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            rows="5"
                            value={formData.message}
                            onChange={handleInputChange}
                            required
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none ${
                              theme === 'light' 
                                ? 'bg-white border-gray-300 text-gray-900' 
                                : 'bg-gray-900 border-gray-700 text-white'
                            }`}
                          ></textarea>
                        </div>
                        
                        <button 
                          type="submit" 
                          className="w-full group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 py-3 px-6 md:py-4 md:px-8 rounded-xl font-semibold text-sm md:text-base text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faPaperPlane} />
                            Send Message
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className={`rounded-2xl p-6 md:p-8 h-full ${
                    theme === 'light' 
                      ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                      : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                  }`}>
                    <h3 className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      Why Contact Us?
                    </h3>
                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      {[
                        "Expert advice from automotive professionals",
                        "Quick response within 24 hours",
                        "Custom solutions for your needs",
                        "Best prices guaranteed",
                        "Professional after-sales support"
                      ].map((item, index) => (
                        <li key={index} className={`flex items-start text-sm md:text-base ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                          <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    <div className={`rounded-xl p-4 md:p-6 bg-gradient-to-r ${ColorPalette.primary.gradient} text-white`}>
                      <h4 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faAmbulance} />
                        Emergency Service?
                      </h4>
                      <p className="text-sm md:text-base mb-4 opacity-90">
                        Call our hotline for immediate assistance
                      </p>
                      <a 
                        href="tel:+916207627817" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 text-sm md:text-base font-semibold"
                      >
                        <FontAwesomeIcon icon={faPhone} />
                        +91 9112025454
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* FAQ Section */}
            {activeTab === 'faq' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 md:mb-12">
                  <h3 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    Frequently Asked Questions
                  </h3>
                  <p className={`text-sm md:text-base lg:text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Find quick answers to common questions about our products and services
                  </p>
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  {faqItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        theme === 'light' 
                          ? 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl' 
                          : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl'
                      } ${activeFaq === index ? 'shadow-2xl' : ''}`}
                    >
                      <div 
                        className={`p-4 md:p-6 flex justify-between items-center cursor-pointer transition-colors ${
                          activeFaq === index 
                            ? theme === 'light' ? 'bg-gray-50' : 'bg-gray-700/50'
                            : ''
                        }`}
                        onClick={() => toggleFaq(index)}
                      >
                        <h4 className={`text-base md:text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {item.question}
                        </h4>
                        <FontAwesomeIcon 
                          icon={activeFaq === index ? faChevronUp : faChevronDown} 
                          className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}
                        />
                      </div>
                      {activeFaq === index && (
                        <div className={`px-4 md:px-6 pb-4 md:pb-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                          <p className="text-sm md:text-base leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 md:py-16 lg:py-20 px-4 relative ${theme === 'light' ? BackgroundGradients.light.primary : BackgroundGradients.dark.primary}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Still Have Questions?
          </h2>
          <p className={`text-base md:text-lg mb-6 md:mb-8 max-w-3xl mx-auto ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Our customer support team is always ready to help you with any inquiries
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <a 
              href="tel:+916207627817"
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faPhone} />
                Call Now
              </span>
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-300 from-white/20 to-white/10"></div>
            </a>
            <a 
              href="mailto:info@servx24.com"
              className="group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl border-2 border-cyan-400 text-cyan-400 hover:text-white hover:bg-cyan-400"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} />
                Email Us
              </span>
            </a>
                      </div>
        </div>
      </section>

      
    </div>
  );
};

export default ContactUs;

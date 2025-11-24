
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const LandingPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!isLoading && user) {
      if (user.role === UserRole.CLIENT) {
        navigate('/client/dashboard');
      } else {
        navigate('/creator/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      
      {/* Call to Action Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[128px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to start creating?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join thousands of creators and brands already connecting on Ubuni. 
            Sign up today and get your first month free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              Create Free Account
            </Button>
            <Button variant="outline" size="lg" className="text-white border-slate-700 hover:border-white hover:text-white">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;

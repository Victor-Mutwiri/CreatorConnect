import React from 'react';
import { ArrowRight, Star, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from './Button';
import { HERO_HEADLINE, HERO_SUBHEADLINE } from '../constants';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-brand-100/50 to-transparent blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-2/3 bg-gradient-to-tr from-purple-100/50 to-transparent blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-700">Now live in Kenya 🇰🇪</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              {HERO_HEADLINE.split(' ').map((word, i) => (
                <span key={i} className={i === 2 || i === 3 ? "text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-500" : ""}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
              {HERO_SUBHEADLINE}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/signup">
                <Button size="lg" className="group w-full sm:w-auto">
                  I'm a Creator
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  I'm a Client
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/40/40?random=${i}`} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border-2 border-white ring-1 ring-slate-100"
                  />
                ))}
              </div>
              <div>
                <div className="flex text-yellow-500 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p>Trusted by 500+ Kenyans</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Image / Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-slate-100 aspect-[4/5] lg:aspect-square">
              <img 
                src="https://picsum.photos/800/800?random=100" 
                alt="Kenyan Creator" 
                className="w-full h-full object-cover"
              />
              
              {/* Floating Cards */}
              <div className="absolute top-8 left-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Verified</p>
                  <p className="font-bold text-slate-800">Identity Verified</p>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Collaborations</p>
                  <p className="font-bold text-slate-800">24 Active Jobs</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

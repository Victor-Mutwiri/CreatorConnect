import React, { useState } from 'react';
import { Camera, Briefcase, DollarSign, Search, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'creators' | 'clients'>('creators');

  const creatorFeatures = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Showcase Your Portfolio",
      desc: "Build a stunning profile that highlights your best work, stats, and rates."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Guaranteed Payments",
      desc: "Get paid securely via M-Pesa or Bank Transfer upon project completion. No more chasing invoices."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Direct Job Offers",
      desc: "Stop cold emailing. Let brands find you and send direct collaboration requests."
    }
  ];

  const clientFeatures = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Discover Top Talent",
      desc: "Filter influencers by niche, location (Nairobi, Mombasa, etc.), and engagement rates."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Transactions",
      desc: "Funds are held in escrow until the work is delivered and approved by you."
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "Manage Campaigns",
      desc: "Track deliverables, chat with creators, and manage contracts all in one dashboard."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            A Platform Built for Everyone
          </h2>
          <p className="text-lg text-slate-600">
            Whether you're creating content or looking for the perfect brand ambassador, we've streamlined the process.
          </p>
          
          <div className="mt-8 inline-flex bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === 'creators' 
                  ? 'bg-white text-brand-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              For Creators
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === 'clients' 
                  ? 'bg-white text-brand-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              For Clients
            </button>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {(activeTab === 'creators' ? creatorFeatures : clientFeatures).map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                    activeTab === 'creators' ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-brand-100 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Features;
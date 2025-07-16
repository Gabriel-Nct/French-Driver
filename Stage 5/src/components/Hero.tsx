import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" />
            Innovation dans le transport
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
            <span className="block">French Driver</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 max-w-3xl mx-auto font-light animate-fade-in-up delay-200">
            Révolutionnez votre expérience de transport avec une plateforme moderne, équitable et transparente
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300">
            Une solution complète pour chauffeurs et passagers, pensée pour l'efficacité et la transparence
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-400">
            <button
              onClick={scrollToFeatures}
              className="group bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center"
            >
              Découvrir l'application
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              onClick={() => window.open('https://github.com/Gabriel-Nct/French-Driver/tree/develop', '_blank')}
              className="group border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Voir le code source
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
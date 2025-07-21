import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, UserPlus, X } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: React.ComponentType<any>;
}

const Features: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const features: Feature[] = [
    {
      id: 'reservation',
      title: 'Page de Réservation',
      description: 'Réservez un chauffeur en quelques clics grâce à une interface simple et rapide, pensée pour les passagers comme pour les professionnels.',
      image: '/images/page-reservation.png', // Remettez vos vraies images
      icon: Calendar
    },
    {
      id: 'dashboard',
      title: 'Dashboard Admin',
      description: 'Gérez l\'ensemble de vos opérations avec un tableau de bord complet : statistiques, utilisateurs, réservations, et plus encore.',
      image: '/images/dashboard-admin.png',
      icon: BarChart3
    },
    {
      id: 'drivers',
      title: 'Gestion des Chauffeurs',
      description: 'Ajoutez facilement de nouveaux chauffeurs à la plateforme avec toutes leurs informations : véhicule, contact et statut.',
      image: '/images/ajout-chauffeurs.png',
      icon: UserPlus
    }
  ];

  const openLightbox = (image: string) => {
    setSelectedImage(image);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Fermer avec la touche Échap et bloquer le scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Fonctionnalités
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les outils puissants qui font de French Driver une solution complète
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                    onClick={() => openLightbox(feature.image)}
                  />
                  
                  {/* Gradient overlay - plus simple */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-colors duration-300 pointer-events-none"></div>
                  
                  {/* Icône en haut à droite */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 pointer-events-none">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  {/* Indicateur de clic simplifié */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-white/30 backdrop-blur-sm rounded-full p-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2"
            >
              <X size={24} />
              <span className="text-sm font-medium">Fermer (ESC)</span>
            </button>
            <img
              src={selectedImage}
              alt="Agrandissement de l'image"
              className="max-w-full max-h-full rounded-lg shadow-2xl border-2 border-white/20"
              style={{ maxHeight: '80vh' }}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              Cliquez à l'extérieur pour fermer
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Features;
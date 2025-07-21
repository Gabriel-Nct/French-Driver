import React from 'react';
import { ExternalLink, Github, Linkedin, Award } from 'lucide-react';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Gabriel Bescond',
      linkedin: 'https://www.linkedin.com/in/gabriel-bescond-149232348',
      role: 'Développeur Full-Stack'
    },
    {
      name: 'Brahim',
      linkedin: 'https://www.linkedin.com/in/brhcam/',
      role: 'Développeur Full-Stack'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                À Propos
              </h2>
              <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                <p>
                  Le marché du transport est en pleine transformation digitale. Face aux 
                  commissions élevées des plateformes traditionnelles, à la rigidité des 
                  centrales classiques et au manque de visibilité pour les chauffeurs, 
                  nous avons créé French Driver.
                </p>
                <p>
                  Notre mission est de créer une plateforme équitable qui profite aux 
                  chauffeurs, passagers et opérateurs. Nous croyons en la transparence, 
                  l'innovation et la simplicité.
                </p>
              </div>
            </div>

            {/* Team */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Équipe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      <Linkedin className="w-4 h-4 mr-1" />
                      LinkedIn
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

{/* Visual */}
<div className="text-center lg:text-right">
  <div className="bg-gray-50 rounded-2xl p-6 text-gray-900 mb-8">
    <div className="flex items-center justify-center lg:justify-end gap-4">
      <img
        src="https://i.ibb.co/JwRnFGcy/logo.png"
        alt="Logo French Driver"
        className="h-20 w-auto"
      />
      <h3 className="text-5xl sm:text-5xl font-bold mb-0">
        French Driver
      </h3>
    </div>
    <p className="text-lg mt-2 text-gray-700">
      L'avenir du transport français
    </p>
  </div>

  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-center mb-4">
      <Github className="w-8 h-8 text-gray-700 mr-3" />
      <h4 className="text-xl font-semibold text-gray-900">Portfolio Project</h4>
    </div>
    <p className="text-gray-600">
      Projet réalisé dans le cadre de la formation{' '}
      <span className="font-semibold text-blue-600">Holberton School</span>
    </p>
    <a
      href="https://github.com/Gabriel-Nct/French-Driver/tree/develop"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200"
    >
      <ExternalLink className="w-5 h-5 mr-2" />
      Voir le code source
    </a>
  </div>
</div>


        </div>
      </div>
    </section>
  );
};

export default About;
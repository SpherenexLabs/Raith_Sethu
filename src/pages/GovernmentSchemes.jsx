import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, TrendingUp, Heart, BookOpen, ExternalLink, Phone, Mail, MapPin } from 'lucide-react';

const GovernmentSchemes = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const schemes = [
    {
      id: 'pmkisan',
      category: 'subsidy',
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      shortDesc: '₹6,000 per year income support for farmers',
      description: 'All landholding farmers get ₹6,000 per year in three equal installments of ₹2,000 directly into their bank accounts.',
      eligibility: [
        'Landholding farmers (individual or family)',
        'All farmer families across the country',
        'Aadhaar card mandatory'
      ],
      benefits: '₹6,000 per year (₹2,000 every 4 months)',
      howToApply: 'Visit PM-KISAN portal (pmkisan.gov.in) or nearest CSC center',
      contact: 'PM-KISAN Helpline: 155261 / 011-24300606',
      link: 'https://pmkisan.gov.in/',
      icon: '💰'
    },
    {
      id: 'pmfby',
      category: 'insurance',
      name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
      shortDesc: 'Comprehensive crop insurance scheme',
      description: 'Provides insurance coverage and financial support to farmers in case of crop failure due to natural calamities, pests & diseases.',
      eligibility: [
        'All farmers including sharecroppers and tenant farmers',
        'Applicable for food crops, oilseeds, annual commercial/horticultural crops'
      ],
      benefits: 'Coverage for crop loss due to natural disasters, pests, diseases',
      howToApply: 'Through banks, CSCs, or PMFBY portal within cut-off date',
      contact: 'PMFBY Helpline: 011-23382012',
      link: 'https://pmfby.gov.in/',
      icon: '🛡️'
    },
    {
      id: 'kcc',
      category: 'loan',
      name: 'Kisan Credit Card (KCC)',
      shortDesc: 'Credit facility for farmers at concessional interest rates',
      description: 'Provides adequate and timely credit support for cultivation and other needs including agriculture term loans at concessional interest rate.',
      eligibility: [
        'Farmers – Owner cultivators, Tenant farmers, Oral lessees & Share croppers',
        'SHGs or Joint Liability Groups of farmers'
      ],
      benefits: 'Credit up to ₹3 lakh at 4% interest (with interest subvention)',
      howToApply: 'Apply at nearest bank branch with land documents and identity proof',
      contact: 'Contact your nearest bank branch',
      link: 'https://www.nabard.org/content1.aspx?id=523&catid=23',
      icon: '💳'
    },
    {
      id: 'soil',
      category: 'subsidy',
      name: 'Soil Health Card Scheme',
      shortDesc: 'Free soil testing and recommendations',
      description: 'Provides soil health cards to farmers every 2 years with information on nutrient status and recommendations on fertilizer dosage.',
      eligibility: [
        'All farmers across the country',
        'No fees for soil testing'
      ],
      benefits: 'Free soil testing and customized fertilizer recommendations',
      howToApply: 'Contact Soil Health Lab or Agriculture Department office',
      contact: 'Agri. Dept: 080-22212722',
      link: 'https://soilhealth.dac.gov.in/',
      icon: '🌱'
    },
    {
      id: 'paramparagat',
      category: 'subsidy',
      name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
      shortDesc: 'Support for organic farming',
      description: 'Promotes organic farming through cluster approach and PGS certification. Financial assistance of ₹50,000 per hectare for 3 years.',
      eligibility: [
        'Farmers willing to adopt organic farming',
        'Cluster of 50 or more farmers'
      ],
      benefits: '₹50,000/ha for 3 years (cluster approach)',
      howToApply: 'Through State Agriculture Departments',
      contact: 'State Agriculture Office',
      link: 'https://pgsindia-ncof.gov.in/',
      icon: '🌾'
    },
    {
      id: 'irrigation',
      category: 'subsidy',
      name: 'PM Krishi Sinchai Yojana (PMKSY)',
      shortDesc: 'Subsidy for micro-irrigation systems',
      description: 'Provides financial assistance for adoption of precision irrigation systems like drip and sprinkler irrigation.',
      eligibility: [
        'All categories of farmers',
        'Subsidy varies by state (40-50% for general, 55-60% for SC/ST)'
      ],
      benefits: 'Up to 50% subsidy on drip/sprinkler irrigation',
      howToApply: 'Apply through Horticulture/Agriculture Department',
      contact: 'Horticulture Dept: 080-22372022',
      link: 'https://pmksy.gov.in/',
      icon: '💧'
    },
    {
      id: 'kisan',
      category: 'training',
      name: 'National Agriculture Market (e-NAM)',
      shortDesc: 'Online trading platform for agricultural commodities',
      description: 'Pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.',
      eligibility: [
        'All farmers can register on e-NAM portal',
        'Free registration'
      ],
      benefits: 'Better price discovery, transparency, reduced transaction costs',
      howToApply: 'Register on e-NAM portal with Aadhaar and bank account',
      contact: 'e-NAM Helpline: 1800-270-0224',
      link: 'https://www.enam.gov.in/',
      icon: '📱'
    },
    {
      id: 'startup',
      category: 'training',
      name: 'Agriculture Infrastructure Fund',
      shortDesc: '₹1 lakh crore fund for agri-infrastructure',
      description: 'Medium to long term debt financing facility for investment in viable projects for post-harvest management infrastructure and community farming assets.',
      eligibility: [
        'Farmers, PACS, FPOs, Agri-entrepreneurs, Start-ups',
        'Eligible for loans up to ₹2 crore'
      ],
      benefits: '3% interest subvention, credit guarantee coverage',
      howToApply: 'Apply through banks with project proposal',
      contact: 'Contact nearest bank branch',
      link: 'https://agriinfra.dac.gov.in/',
      icon: '🏗️'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Schemes', icon: '📋' },
    { id: 'subsidy', name: 'Subsidies', icon: '💰' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'loan', name: 'Loans & Credit', icon: '💳' },
    { id: 'training', name: 'Training & Support', icon: '📚' }
  ];

  const filteredSchemes = schemes.filter(scheme => 
    selectedCategory === 'all' || scheme.category === selectedCategory
  );

  return (
    <div className="government-schemes-page">
      <div className="page-header">
        <div>
          <h1>
            <Shield size={32} />
            Government Schemes
          </h1>
          <p>Subsidies, Insurance, Loans & Support programs for farmers</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Schemes List */}
      <div className="schemes-container">
        {filteredSchemes.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-header">
              <span className="scheme-icon">{scheme.icon}</span>
              <div className="scheme-title-section">
                <h2>{scheme.name}</h2>
                <p className="scheme-short-desc">{scheme.shortDesc}</p>
              </div>
            </div>

            <div className="scheme-body">
              <div className="scheme-section">
                <h3>About the Scheme</h3>
                <p>{scheme.description}</p>
              </div>

              <div className="scheme-section">
                <h3>Eligibility</h3>
                <ul>
                  {scheme.eligibility.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="scheme-section">
                <h3>Benefits</h3>
                <p className="benefits-text">{scheme.benefits}</p>
              </div>

              <div className="scheme-section">
                <h3>How to Apply</h3>
                <p>{scheme.howToApply}</p>
              </div>

              <div className="scheme-section">
                <h3>Contact Information</h3>
                <p className="contact-text">{scheme.contact}</p>
              </div>

              <div className="scheme-actions">
                <a 
                  href={scheme.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={16} />
                  Visit Official Website
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important Contacts */}
      <div className="contacts-section">
        <h2>Important Agricultural Department Contacts</h2>
        <div className="contacts-grid">
          <div className="contact-card">
            <Phone size={24} />
            <h3>Kisan Call Center</h3>
            <p className="contact-info">1800-180-1551</p>
            <p className="contact-desc">24x7 toll-free helpline for farmers</p>
          </div>

          <div className="contact-card">
            <MapPin size={24} />
            <h3>Agriculture Department, Karnataka</h3>
            <p className="contact-info">080-22212722</p>
            <p className="contact-desc">Main office, Bangalore</p>
          </div>

          <div className="contact-card">
            <Mail size={24} />
            <h3>Email Support</h3>
            <p className="contact-info">support@agricoop.gov.in</p>
            <p className="contact-desc">For queries and grievances</p>
          </div>

          <div className="contact-card">
            <BookOpen size={24} />
            <h3>Horticulture Department</h3>
            <p className="contact-info">080-22372022</p>
            <p className="contact-desc">For irrigation subsidies</p>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="resources-section">
        <h2>Additional Resources</h2>
        <div className="resources-list">
          <a href="https://farmer.gov.in/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <ExternalLink size={16} />
            Farmer Portal (Government of India)
          </a>
          <a href="https://mkisan.gov.in/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <ExternalLink size={16} />
            mKisan Portal (SMS Advisory)
          </a>
          <a href="https://krishijagran.com/agripedia/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <ExternalLink size={16} />
            Krishi Jagran (Agriculture News)
          </a>
          <a href="https://icar.org.in/" target="_blank" rel="noopener noreferrer" className="resource-link">
            <ExternalLink size={16} />
            ICAR (Research & Education)
          </a>
        </div>
      </div>
    </div>
  );
};

export default GovernmentSchemes;

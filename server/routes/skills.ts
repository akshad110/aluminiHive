import { RequestHandler } from "express";

// Cache for skills data
let skillsCache: any[] = [];
let cacheExpiry = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getSkills: RequestHandler = async (req, res) => {
  try {
    // Check cache first
    if (skillsCache.length > 0 && Date.now() < cacheExpiry) {
      return res.json({ skills: skillsCache });
    }

    // Fallback to comprehensive skills list if ESCO API is not available
    const skills = [
      // Programming Languages
      { id: "programming-languages", category: "Programming Languages", name: "Programming Languages" },
      { id: "javascript", category: "Programming Languages", name: "JavaScript" },
      { id: "python", category: "Programming Languages", name: "Python" },
      { id: "java", category: "Programming Languages", name: "Java" },
      { id: "csharp", category: "Programming Languages", name: "C#" },
      { id: "cpp", category: "Programming Languages", name: "C++" },
      { id: "c", category: "Programming Languages", name: "C" },
      { id: "php", category: "Programming Languages", name: "PHP" },
      { id: "ruby", category: "Programming Languages", name: "Ruby" },
      { id: "go", category: "Programming Languages", name: "Go" },
      { id: "rust", category: "Programming Languages", name: "Rust" },
      { id: "swift", category: "Programming Languages", name: "Swift" },
      { id: "kotlin", category: "Programming Languages", name: "Kotlin" },
      { id: "scala", category: "Programming Languages", name: "Scala" },
      { id: "r", category: "Programming Languages", name: "R" },
      { id: "matlab", category: "Programming Languages", name: "MATLAB" },
      { id: "perl", category: "Programming Languages", name: "Perl" },
      { id: "dart", category: "Programming Languages", name: "Dart" },
      { id: "typescript", category: "Programming Languages", name: "TypeScript" },

      // Web Technologies
      { id: "web-technologies", category: "Web Technologies", name: "Web Technologies" },
      { id: "html", category: "Web Technologies", name: "HTML" },
      { id: "css", category: "Web Technologies", name: "CSS" },
      { id: "react", category: "Web Technologies", name: "React" },
      { id: "angular", category: "Web Technologies", name: "Angular" },
      { id: "vue", category: "Web Technologies", name: "Vue.js" },
      { id: "nodejs", category: "Web Technologies", name: "Node.js" },
      { id: "express", category: "Web Technologies", name: "Express.js" },
      { id: "django", category: "Web Technologies", name: "Django" },
      { id: "flask", category: "Web Technologies", name: "Flask" },
      { id: "spring", category: "Web Technologies", name: "Spring" },
      { id: "laravel", category: "Web Technologies", name: "Laravel" },
      { id: "aspnet", category: "Web Technologies", name: "ASP.NET" },
      { id: "jquery", category: "Web Technologies", name: "jQuery" },
      { id: "bootstrap", category: "Web Technologies", name: "Bootstrap" },
      { id: "tailwind", category: "Web Technologies", name: "Tailwind CSS" },
      { id: "sass", category: "Web Technologies", name: "Sass" },
      { id: "less", category: "Web Technologies", name: "Less" },

      // Databases
      { id: "databases", category: "Databases", name: "Databases" },
      { id: "mysql", category: "Databases", name: "MySQL" },
      { id: "postgresql", category: "Databases", name: "PostgreSQL" },
      { id: "mongodb", category: "Databases", name: "MongoDB" },
      { id: "redis", category: "Databases", name: "Redis" },
      { id: "oracle", category: "Databases", name: "Oracle" },
      { id: "sqlserver", category: "Databases", name: "SQL Server" },
      { id: "sqlite", category: "Databases", name: "SQLite" },
      { id: "cassandra", category: "Databases", name: "Cassandra" },
      { id: "elasticsearch", category: "Databases", name: "Elasticsearch" },
      { id: "dynamodb", category: "Databases", name: "DynamoDB" },
      { id: "firebase", category: "Databases", name: "Firebase" },

      // Cloud & DevOps
      { id: "cloud-devops", category: "Cloud & DevOps", name: "Cloud & DevOps" },
      { id: "aws", category: "Cloud & DevOps", name: "AWS" },
      { id: "azure", category: "Cloud & DevOps", name: "Azure" },
      { id: "gcp", category: "Cloud & DevOps", name: "Google Cloud Platform" },
      { id: "docker", category: "Cloud & DevOps", name: "Docker" },
      { id: "kubernetes", category: "Cloud & DevOps", name: "Kubernetes" },
      { id: "jenkins", category: "Cloud & DevOps", name: "Jenkins" },
      { id: "gitlab", category: "Cloud & DevOps", name: "GitLab" },
      { id: "github", category: "Cloud & DevOps", name: "GitHub" },
      { id: "terraform", category: "Cloud & DevOps", name: "Terraform" },
      { id: "ansible", category: "Cloud & DevOps", name: "Ansible" },
      { id: "nginx", category: "Cloud & DevOps", name: "Nginx" },
      { id: "apache", category: "Cloud & DevOps", name: "Apache" },

      // Data Science & AI
      { id: "data-science-ai", category: "Data Science & AI", name: "Data Science & AI" },
      { id: "machine-learning", category: "Data Science & AI", name: "Machine Learning" },
      { id: "deep-learning", category: "Data Science & AI", name: "Deep Learning" },
      { id: "artificial-intelligence", category: "Data Science & AI", name: "Artificial Intelligence" },
      { id: "data-analysis", category: "Data Science & AI", name: "Data Analysis" },
      { id: "statistics", category: "Data Science & AI", name: "Statistics" },
      { id: "pandas", category: "Data Science & AI", name: "Pandas" },
      { id: "numpy", category: "Data Science & AI", name: "NumPy" },
      { id: "scikit-learn", category: "Data Science & AI", name: "Scikit-learn" },
      { id: "tensorflow", category: "Data Science & AI", name: "TensorFlow" },
      { id: "pytorch", category: "Data Science & AI", name: "PyTorch" },
      { id: "keras", category: "Data Science & AI", name: "Keras" },
      { id: "opencv", category: "Data Science & AI", name: "OpenCV" },
      { id: "nltk", category: "Data Science & AI", name: "NLTK" },
      { id: "spacy", category: "Data Science & AI", name: "spaCy" },
      { id: "jupyter", category: "Data Science & AI", name: "Jupyter" },
      { id: "tableau", category: "Data Science & AI", name: "Tableau" },
      { id: "powerbi", category: "Data Science & AI", name: "Power BI" },

      // Mobile Development
      { id: "mobile-development", category: "Mobile Development", name: "Mobile Development" },
      { id: "ios-development", category: "Mobile Development", name: "iOS Development" },
      { id: "android-development", category: "Mobile Development", name: "Android Development" },
      { id: "react-native", category: "Mobile Development", name: "React Native" },
      { id: "flutter", category: "Mobile Development", name: "Flutter" },
      { id: "xamarin", category: "Mobile Development", name: "Xamarin" },
      { id: "ionic", category: "Mobile Development", name: "Ionic" },
      { id: "cordova", category: "Mobile Development", name: "Cordova" },

      // Software Engineering
      { id: "software-engineering", category: "Software Engineering", name: "Software Engineering" },
      { id: "software-architecture", category: "Software Engineering", name: "Software Architecture" },
      { id: "design-patterns", category: "Software Engineering", name: "Design Patterns" },
      { id: "agile", category: "Software Engineering", name: "Agile" },
      { id: "scrum", category: "Software Engineering", name: "Scrum" },
      { id: "kanban", category: "Software Engineering", name: "Kanban" },
      { id: "test-driven-development", category: "Software Engineering", name: "Test-Driven Development" },
      { id: "continuous-integration", category: "Software Engineering", name: "Continuous Integration" },
      { id: "continuous-deployment", category: "Software Engineering", name: "Continuous Deployment" },
      { id: "microservices", category: "Software Engineering", name: "Microservices" },
      { id: "api-design", category: "Software Engineering", name: "API Design" },
      { id: "rest", category: "Software Engineering", name: "REST" },
      { id: "graphql", category: "Software Engineering", name: "GraphQL" },
      { id: "soap", category: "Software Engineering", name: "SOAP" },

      // Testing
      { id: "testing", category: "Testing", name: "Testing" },
      { id: "unit-testing", category: "Testing", name: "Unit Testing" },
      { id: "integration-testing", category: "Testing", name: "Integration Testing" },
      { id: "end-to-end-testing", category: "Testing", name: "End-to-End Testing" },
      { id: "junit", category: "Testing", name: "JUnit" },
      { id: "pytest", category: "Testing", name: "pytest" },
      { id: "jest", category: "Testing", name: "Jest" },
      { id: "mocha", category: "Testing", name: "Mocha" },
      { id: "cypress", category: "Testing", name: "Cypress" },
      { id: "selenium", category: "Testing", name: "Selenium" },
      { id: "playwright", category: "Testing", name: "Playwright" },

      // Security
      { id: "security", category: "Security", name: "Security" },
      { id: "cybersecurity", category: "Security", name: "Cybersecurity" },
      { id: "network-security", category: "Security", name: "Network Security" },
      { id: "application-security", category: "Security", name: "Application Security" },
      { id: "penetration-testing", category: "Security", name: "Penetration Testing" },
      { id: "ethical-hacking", category: "Security", name: "Ethical Hacking" },
      { id: "owasp", category: "Security", name: "OWASP" },
      { id: "ssl-tls", category: "Security", name: "SSL/TLS" },
      { id: "oauth", category: "Security", name: "OAuth" },
      { id: "jwt", category: "Security", name: "JWT" },

      // Business & Management
      { id: "business-management", category: "Business & Management", name: "Business & Management" },
      { id: "project-management", category: "Business & Management", name: "Project Management" },
      { id: "product-management", category: "Business & Management", name: "Product Management" },
      { id: "business-analysis", category: "Business & Management", name: "Business Analysis" },
      { id: "strategic-planning", category: "Business & Management", name: "Strategic Planning" },
      { id: "risk-management", category: "Business & Management", name: "Risk Management" },
      { id: "change-management", category: "Business & Management", name: "Change Management" },
      { id: "stakeholder-management", category: "Business & Management", name: "Stakeholder Management" },
      { id: "agile-project-management", category: "Business & Management", name: "Agile Project Management" },
      { id: "scrum-master", category: "Business & Management", name: "Scrum Master" },
      { id: "product-owner", category: "Business & Management", name: "Product Owner" },

      // Communication & Soft Skills
      { id: "communication-soft-skills", category: "Communication & Soft Skills", name: "Communication & Soft Skills" },
      { id: "leadership", category: "Communication & Soft Skills", name: "Leadership" },
      { id: "teamwork", category: "Communication & Soft Skills", name: "Teamwork" },
      { id: "communication", category: "Communication & Soft Skills", name: "Communication" },
      { id: "presentation-skills", category: "Communication & Soft Skills", name: "Presentation Skills" },
      { id: "negotiation", category: "Communication & Soft Skills", name: "Negotiation" },
      { id: "problem-solving", category: "Communication & Soft Skills", name: "Problem Solving" },
      { id: "critical-thinking", category: "Communication & Soft Skills", name: "Critical Thinking" },
      { id: "time-management", category: "Communication & Soft Skills", name: "Time Management" },
      { id: "mentoring", category: "Communication & Soft Skills", name: "Mentoring" },
      { id: "coaching", category: "Communication & Soft Skills", name: "Coaching" },
      { id: "conflict-resolution", category: "Communication & Soft Skills", name: "Conflict Resolution" },
      { id: "emotional-intelligence", category: "Communication & Soft Skills", name: "Emotional Intelligence" },

      // Design & Creative
      { id: "design-creative", category: "Design & Creative", name: "Design & Creative" },
      { id: "ui-design", category: "Design & Creative", name: "UI Design" },
      { id: "ux-design", category: "Design & Creative", name: "UX Design" },
      { id: "graphic-design", category: "Design & Creative", name: "Graphic Design" },
      { id: "web-design", category: "Design & Creative", name: "Web Design" },
      { id: "illustrator", category: "Design & Creative", name: "Adobe Illustrator" },
      { id: "photoshop", category: "Design & Creative", name: "Adobe Photoshop" },
      { id: "figma", category: "Design & Creative", name: "Figma" },
      { id: "sketch", category: "Design & Creative", name: "Sketch" },
      { id: "invision", category: "Design & Creative", name: "InVision" },
      { id: "prototyping", category: "Design & Creative", name: "Prototyping" },
      { id: "wireframing", category: "Design & Creative", name: "Wireframing" },
      { id: "user-research", category: "Design & Creative", name: "User Research" },
      { id: "usability-testing", category: "Design & Creative", name: "Usability Testing" },

      // Marketing & Sales
      { id: "marketing-sales", category: "Marketing & Sales", name: "Marketing & Sales" },
      { id: "digital-marketing", category: "Marketing & Sales", name: "Digital Marketing" },
      { id: "social-media-marketing", category: "Marketing & Sales", name: "Social Media Marketing" },
      { id: "content-marketing", category: "Marketing & Sales", name: "Content Marketing" },
      { id: "email-marketing", category: "Marketing & Sales", name: "Email Marketing" },
      { id: "seo", category: "Marketing & Sales", name: "SEO" },
      { id: "sem", category: "Marketing & Sales", name: "SEM" },
      { id: "google-analytics", category: "Marketing & Sales", name: "Google Analytics" },
      { id: "sales", category: "Marketing & Sales", name: "Sales" },
      { id: "customer-relationship-management", category: "Marketing & Sales", name: "Customer Relationship Management" },
      { id: "market-research", category: "Marketing & Sales", name: "Market Research" },
      { id: "brand-management", category: "Marketing & Sales", name: "Brand Management" },

      // Finance & Accounting
      { id: "finance-accounting", category: "Finance & Accounting", name: "Finance & Accounting" },
      { id: "financial-analysis", category: "Finance & Accounting", name: "Financial Analysis" },
      { id: "accounting", category: "Finance & Accounting", name: "Accounting" },
      { id: "bookkeeping", category: "Finance & Accounting", name: "Bookkeeping" },
      { id: "budgeting", category: "Finance & Accounting", name: "Budgeting" },
      { id: "financial-modeling", category: "Finance & Accounting", name: "Financial Modeling" },
      { id: "investment-analysis", category: "Finance & Accounting", name: "Investment Analysis" },
      { id: "risk-assessment", category: "Finance & Accounting", name: "Risk Assessment" },
      { id: "tax-preparation", category: "Finance & Accounting", name: "Tax Preparation" },
      { id: "auditing", category: "Finance & Accounting", name: "Auditing" },
      { id: "quickbooks", category: "Finance & Accounting", name: "QuickBooks" },
      { id: "excel", category: "Finance & Accounting", name: "Microsoft Excel" },

      // Healthcare & Medical
      { id: "healthcare-medical", category: "Healthcare & Medical", name: "Healthcare & Medical" },
      { id: "patient-care", category: "Healthcare & Medical", name: "Patient Care" },
      { id: "medical-terminology", category: "Healthcare & Medical", name: "Medical Terminology" },
      { id: "clinical-research", category: "Healthcare & Medical", name: "Clinical Research" },
      { id: "healthcare-administration", category: "Healthcare & Medical", name: "Healthcare Administration" },
      { id: "medical-billing", category: "Healthcare & Medical", name: "Medical Billing" },
      { id: "healthcare-informatics", category: "Healthcare & Medical", name: "Healthcare Informatics" },
      { id: "pharmaceutical-sales", category: "Healthcare & Medical", name: "Pharmaceutical Sales" },
      { id: "medical-devices", category: "Healthcare & Medical", name: "Medical Devices" },
      { id: "telemedicine", category: "Healthcare & Medical", name: "Telemedicine" },

      // Education & Training
      { id: "education-training", category: "Education & Training", name: "Education & Training" },
      { id: "curriculum-development", category: "Education & Training", name: "Curriculum Development" },
      { id: "instructional-design", category: "Education & Training", name: "Instructional Design" },
      { id: "e-learning", category: "Education & Training", name: "E-Learning" },
      { id: "training-delivery", category: "Education & Training", name: "Training Delivery" },
      { id: "assessment-design", category: "Education & Training", name: "Assessment Design" },
      { id: "educational-technology", category: "Education & Training", name: "Educational Technology" },
      { id: "adult-learning", category: "Education & Training", name: "Adult Learning" },
      { id: "classroom-management", category: "Education & Training", name: "Classroom Management" },
      { id: "special-education", category: "Education & Training", name: "Special Education" },

      // Legal & Compliance
      { id: "legal-compliance", category: "Legal & Compliance", name: "Legal & Compliance" },
      { id: "contract-law", category: "Legal & Compliance", name: "Contract Law" },
      { id: "intellectual-property", category: "Legal & Compliance", name: "Intellectual Property" },
      { id: "employment-law", category: "Legal & Compliance", name: "Employment Law" },
      { id: "regulatory-compliance", category: "Legal & Compliance", name: "Regulatory Compliance" },
      { id: "data-privacy", category: "Legal & Compliance", name: "Data Privacy" },
      { id: "gdpr", category: "Legal & Compliance", name: "GDPR" },
      { id: "legal-research", category: "Legal & Compliance", name: "Legal Research" },
      { id: "litigation", category: "Legal & Compliance", name: "Litigation" },
      { id: "corporate-law", category: "Legal & Compliance", name: "Corporate Law" },

      // Manufacturing & Engineering
      { id: "manufacturing-engineering", category: "Manufacturing & Engineering", name: "Manufacturing & Engineering" },
      { id: "mechanical-engineering", category: "Manufacturing & Engineering", name: "Mechanical Engineering" },
      { id: "electrical-engineering", category: "Manufacturing & Engineering", name: "Electrical Engineering" },
      { id: "civil-engineering", category: "Manufacturing & Engineering", name: "Civil Engineering" },
      { id: "chemical-engineering", category: "Manufacturing & Engineering", name: "Chemical Engineering" },
      { id: "industrial-engineering", category: "Manufacturing & Engineering", name: "Industrial Engineering" },
      { id: "quality-control", category: "Manufacturing & Engineering", name: "Quality Control" },
      { id: "supply-chain-management", category: "Manufacturing & Engineering", name: "Supply Chain Management" },
      { id: "lean-manufacturing", category: "Manufacturing & Engineering", name: "Lean Manufacturing" },
      { id: "six-sigma", category: "Manufacturing & Engineering", name: "Six Sigma" },
      { id: "autocad", category: "Manufacturing & Engineering", name: "AutoCAD" },
      { id: "solidworks", category: "Manufacturing & Engineering", name: "SolidWorks" },

      // Research & Analysis
      { id: "research-analysis", category: "Research & Analysis", name: "Research & Analysis" },
      { id: "qualitative-research", category: "Research & Analysis", name: "Qualitative Research" },
      { id: "quantitative-research", category: "Research & Analysis", name: "Quantitative Research" },
      { id: "market-analysis", category: "Research & Analysis", name: "Market Analysis" },
      { id: "competitive-analysis", category: "Research & Analysis", name: "Competitive Analysis" },
      { id: "data-visualization", category: "Research & Analysis", name: "Data Visualization" },
      { id: "survey-design", category: "Research & Analysis", name: "Survey Design" },
      { id: "focus-groups", category: "Research & Analysis", name: "Focus Groups" },
      { id: "literature-review", category: "Research & Analysis", name: "Literature Review" },
      { id: "spss", category: "Research & Analysis", name: "SPSS" },
      { id: "r-studio", category: "Research & Analysis", name: "R Studio" }
    ];

    // Cache the data
    skillsCache = skills;
    cacheExpiry = Date.now() + CACHE_DURATION;

    res.json({ skills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};

// Search skills with ESCO API integration
export const searchSkills: RequestHandler = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: 'Search query parameter is required' 
      });
    }

    // Try to fetch from ESCO API first
    try {
      const escoUrl = `https://ec.europa.eu/esco/api/skill?text=${encodeURIComponent(q)}&limit=${limit}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      let response: Response | null = null;
      try {
        response = await fetch(escoUrl, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AlumniHive/1.0'
          }
        });
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (response && response.ok) {
        const escoData = await response.json();
        
        // Transform ESCO response to our format
        const escoSkills = escoData._embedded?.results?.map((skill: any) => ({
          id: skill.uri,
          category: "ESCO Skills",
          name: skill.title,
          description: skill.description,
          source: "ESCO"
        })) || [];
        
        // Combine with our local skills
        const localSkills = skillsCache.filter(skill => 
          skill.name.toLowerCase().includes(q.toLowerCase()) ||
          skill.category.toLowerCase().includes(q.toLowerCase())
        );
        
        const combinedSkills = [...localSkills, ...escoSkills];
        
        return res.json({ 
          skills: combinedSkills.slice(0, Number(limit)),
          source: "Combined (Local + ESCO)"
        });
      }
    } catch (escoError) {
      console.warn('ESCO API error, using local skills only:', escoError);
    }
    
    // Fallback to local skills search
    const filteredSkills = skillsCache.filter(skill => 
      skill.name.toLowerCase().includes(q.toLowerCase()) ||
      skill.category.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({ 
      skills: filteredSkills.slice(0, Number(limit)),
      source: "Local"
    });
    
  } catch (error) {
    console.error("Error searching skills:", error);
    res.status(500).json({ error: "Failed to search skills" });
  }
};

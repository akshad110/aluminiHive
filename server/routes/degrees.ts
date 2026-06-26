import { RequestHandler } from "express";

// LinkedIn Degrees API endpoint
const LINKEDIN_DEGREES_API = "https://api.linkedin.com/v2/degrees";

// Cache for degrees data
let degreesCache: any[] = [];
let cacheExpiry = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getDegrees: RequestHandler = async (req, res) => {
  try {
    const { locale = "en_US" } = req.query;
    
    // Check cache first
    if (degreesCache.length > 0 && Date.now() < cacheExpiry) {
      return res.json({ degrees: degreesCache });
    }

    let degrees = [];

    // Try to fetch from LinkedIn API first
    if (process.env.LINKEDIN_ACCESS_TOKEN) {
      try {
        const linkedinResponse = await fetch(`${LINKEDIN_DEGREES_API}?locale.language=en&locale.country=US`, {
          headers: {
            'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json();
          
          // Transform LinkedIn response to our format
          degrees = linkedinData.elements?.map((degree: any) => ({
            id: degree.id,
            name: degree.name?.localized?.en_US || degree.name?.value || degree.name
          })) || [];
        } else {
          console.warn(`LinkedIn API responded with status: ${linkedinResponse.status}, using fallback data`);
        }
      } catch (linkedinError) {
        console.warn('LinkedIn API error, using fallback data:', linkedinError);
      }
    } else {
      console.warn('No LinkedIn access token found, using fallback data');
    }

    // Fallback to comprehensive degree list if LinkedIn API fails or no token
    if (degrees.length === 0) {
      degrees = [
        // Bachelor's Degrees
        { id: "bachelor-accountancy", name: "Bachelor of Accountancy (BAcc)" },
        { id: "bachelor-architecture", name: "Bachelor of Architecture (BArch)" },
        { id: "bachelor-agriculture", name: "Bachelor of Agriculture (BAgr)" },
        { id: "bachelor-arts", name: "Bachelor of Arts (BA)" },
        { id: "bachelor-business-administration", name: "Bachelor of Business Administration (BBA)" },
        { id: "bachelor-commerce", name: "Bachelor of Commerce (BCom)" },
        { id: "bachelor-computer-science", name: "Bachelor of Computer Science (BCS)" },
        { id: "bachelor-computer-application", name: "Bachelor of Computer Application (BCA)" },
        { id: "bachelor-civil-law", name: "Bachelor of Civil Law (BCL)" },
        { id: "bachelor-divinity", name: "Bachelor of Divinity (BDiv)" },
        { id: "bachelor-economics", name: "Bachelor of Economics (BEc)" },
        { id: "bachelor-education", name: "Bachelor of Education (BEd)" },
        { id: "bachelor-engineering", name: "Bachelor of Engineering (BEng)" },
        { id: "bachelor-fine-arts", name: "Bachelor of Fine Arts (BFA)" },
        { id: "bachelor-laws", name: "Bachelor of Laws (LLB)" },
        { id: "bachelor-letters", name: "Bachelor of Letters (BLitt)" },
        { id: "bachelor-music", name: "Bachelor of Music (BM)" },
        { id: "bachelor-management-studies", name: "Bachelor of Management Studies (BMS)" },
        { id: "bachelor-medical-sciences", name: "Bachelor of Medical Sciences (BMed)" },
        { id: "bachelor-pharmacy", name: "Bachelor of Pharmacy (BPharm)" },
        { id: "bachelor-philosophy", name: "Bachelor of Philosophy (BPhil)" },
        { id: "bachelor-physical-education", name: "Bachelor of Physical Education (BPed)" },
        { id: "bachelor-science", name: "Bachelor of Science (BSc)" },
        { id: "bachelor-science-nursing", name: "Bachelor of Science in Nursing (BSn)" },
        { id: "bachelor-science-public-health", name: "Bachelor of Science in Public Health (BSph)" },
        { id: "bachelor-social-work", name: "Bachelor of Social Work (BSW)" },
        { id: "bachelor-technology", name: "Bachelor of Technology (BTech)" },
        { id: "bachelor-theology", name: "Bachelor of Theology (BTh)" },
        { id: "bachelor-medicine-surgery", name: "Bachelor of Medicine, Bachelor of Surgery (MBBS)" },
        
        // Master's Degrees
        { id: "master-business-administration", name: "Master of Business Administration (MBA)" },
        { id: "master-counselling", name: "Master of Counselling (MCouns)" },
        { id: "master-divinity", name: "Master of Divinity (MDiv)" },
        { id: "master-education", name: "Master of Education (MEd)" },
        { id: "master-engineering", name: "Master of Engineering (MEng)" },
        { id: "master-fine-arts", name: "Master of Fine Arts (MFA)" },
        { id: "master-laws", name: "Master of Laws (LLM)" },
        { id: "master-letters", name: "Master of Letters (MLitt)" },
        { id: "master-medicine", name: "Master of Medicine (MMed)" },
        { id: "master-management-studies", name: "Master of Management Studies (MMS)" },
        { id: "master-philosophy", name: "Master of Philosophy (MPhil)" },
        { id: "master-public-administration", name: "Master of Public Administration (MPA)" },
        { id: "master-public-health", name: "Master of Public Health (MPH)" },
        { id: "master-research", name: "Master of Research (MRes)" },
        { id: "master-sacred-theology", name: "Master of Sacred Theology (STM)" },
        { id: "master-science-nursing", name: "Master of Science in Nursing (MSN)" },
        { id: "master-science", name: "Master of Science (MS)" },
        { id: "master-social-work", name: "Master of Social Work (MSW)" },
        { id: "master-studies", name: "Master of Studies (MSt)" },
        { id: "master-surgery", name: "Master of Surgery (ChM or MS)" },
        { id: "master-technology", name: "Master of Technology (Mtech)" },
        { id: "professional-science-masters", name: "Professional Science Masters (PSM)" },
        
        // Doctoral Degrees
        { id: "doctor-arts", name: "Doctor of Arts (DA)" },
        { id: "doctor-audiology", name: "Doctor of Audiology (AuD)" },
        { id: "doctor-business-administration", name: "Doctor of Business Administration (DBA)" },
        { id: "doctor-canon-law", name: "Doctor of Canon Law (JCD)" },
        { id: "doctor-civil-law", name: "Doctor of Civil Law (DCL)" },
        { id: "doctor-clinical-psychology", name: "Doctor of Clinical Psychology (DClinPsy)" },
        { id: "doctor-chiropractic", name: "Doctor of Chiropractic (DC)" },
        { id: "doctor-dental-surgery", name: "Doctor of Dental Surgery (DDS)" },
        { id: "doctor-divinity", name: "Doctor of Divinity (DDiv)" },
        { id: "doctor-education", name: "Doctor of Education (EdD)" },
        { id: "doctor-engineering", name: "Doctor of Engineering (DEng)" },
        { id: "doctor-juridical-science", name: "Doctor of Juridical Science (JSD)" },
        { id: "doctor-letters", name: "Doctor of Letters (DLitt)" },
        { id: "doctor-medicine", name: "Doctor of Medicine (MD)" },
        { id: "doctor-ministry", name: "Doctor of Ministry (DMin)" },
        { id: "doctor-naturopathic-medicine", name: "Doctor of Naturopathic Medicine (ND)" },
        { id: "doctor-osteopathic-medicine", name: "Doctor of Osteopathic Medicine (DO)" },
        { id: "doctor-pharmacy", name: "Doctor of Pharmacy (DPharm)" },
        { id: "doctor-philosophy", name: "Doctor of Philosophy (PhD)" },
        { id: "doctor-psychology", name: "Doctor of Psychology (PsyD)" },
        { id: "doctor-science", name: "Doctor of Science (DSc or ScD)" },
        { id: "doctor-theology", name: "Doctor of Theology (ThD)" },
        { id: "doctor-veterinary-medicine", name: "Doctor of Veterinary Medicine (DVM)" },
        { id: "juris-doctor", name: "Juris Doctor (JD)" },
        
        // Other Degrees
        { id: "associate-degree", name: "Associate Degree" },
        { id: "diploma", name: "Diploma" },
        { id: "certificate", name: "Certificate" },
        { id: "post-graduate-diploma", name: "Post Graduate Diploma" },
        { id: "other", name: "Other" }
      ];
    }

    // Cache the data
    degreesCache = degrees;
    cacheExpiry = Date.now() + CACHE_DURATION;

    res.json({ degrees });
  } catch (error) {
    console.error("Error fetching degrees from LinkedIn API:", error);
    res.status(500).json({ error: "Failed to fetch degrees from LinkedIn API" });
  }
};

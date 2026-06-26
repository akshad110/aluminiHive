import { RequestHandler } from "express";

// Dummy college data - in a real app, this would come from a database
const COLLEGES = [
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Delhi", 
  "Indian Institute of Technology Madras",
  "Indian Institute of Technology Kanpur",
  "Indian Institute of Technology Kharagpur",
  "Indian Institute of Technology Roorkee",
  "Indian Institute of Technology Guwahati",
  "Indian Institute of Technology Hyderabad",
  "Indian Institute of Technology Indore",
  "Indian Institute of Technology Jodhpur",
  "Indian Institute of Technology Patna",
  "Indian Institute of Technology Ropar",
  "Indian Institute of Technology Bhubaneswar",
  "Indian Institute of Technology Gandhinagar",
  "Indian Institute of Technology Mandi",
  "Indian Institute of Technology Jodhpur",
  "National Institute of Technology Trichy",
  "National Institute of Technology Warangal",
  "National Institute of Technology Surathkal",
  "National Institute of Technology Calicut",
  "National Institute of Technology Durgapur",
  "National Institute of Technology Allahabad",
  "National Institute of Technology Bhopal",
  "National Institute of Technology Jaipur",
  "National Institute of Technology Kurukshetra",
  "National Institute of Technology Rourkela",
  "National Institute of Technology Silchar",
  "National Institute of Technology Srinagar",
  "National Institute of Technology Hamirpur",
  "National Institute of Technology Jalandhar",
  "Birla Institute of Technology and Science, Pilani",
  "Birla Institute of Technology and Science, Goa",
  "Birla Institute of Technology and Science, Hyderabad",
  "Delhi University",
  "Anna University",
  "Savitribai Phule Pune University",
  "University of Mumbai",
  "Vellore Institute of Technology",
  "SRM Institute of Science and Technology",
  "Amity University",
  "Christ University",
  "Jamia Millia Islamia",
  "Jawaharlal Nehru University",
  "Banaras Hindu University",
  "University of Calcutta",
  "University of Madras",
  "Osmania University",
  "Panjab University",
  "University of Delhi",
  "Aligarh Muslim University",
  "Jadavpur University",
  "Indian Institute of Science Bangalore",
  "Tata Institute of Fundamental Research",
  "Indian Statistical Institute",
  "Indian Institute of Management Ahmedabad",
  "Indian Institute of Management Bangalore",
  "Indian Institute of Management Calcutta",
  "Indian Institute of Management Lucknow",
  "Indian Institute of Management Kozhikode",
  "Indian Institute of Management Indore",
  "Indian Institute of Management Shillong",
  "Indian Institute of Management Ranchi",
  "Indian Institute of Management Rohtak",
  "Indian Institute of Management Udaipur",
  "Indian Institute of Management Tiruchirappalli",
  "Indian Institute of Management Kashipur",
  "Indian Institute of Management Nagpur",
  "Indian Institute of Management Amritsar",
  "Indian Institute of Management Bodh Gaya",
  "Indian Institute of Management Jammu",
  "Indian Institute of Management Sambalpur",
  "Indian Institute of Management Sirmaur",
  "Indian Institute of Management Visakhapatnam"
];

export const searchColleges: RequestHandler = (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.json({ colleges: COLLEGES.slice(0, 10) });
    }

    const searchTerm = query.toLowerCase().trim();
    const filteredColleges = COLLEGES
      .filter(college => college.toLowerCase().includes(searchTerm))
      .slice(0, 10);

    res.json({ colleges: filteredColleges });
  } catch (error) {
    console.error('College search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

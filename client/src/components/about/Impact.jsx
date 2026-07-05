import "./Impact.css";

import {
  FaUserTie,
  FaLeaf,
  FaWater,
  FaBriefcase,
  FaLightbulb,
  FaGraduationCap,
} from "react-icons/fa";

const impacts = [

{
icon:<FaUserTie />,
title:"Leadership Development",
description:"Developing responsible, ethical and transformational young leaders.",
},

{
icon:<FaLeaf />,
title:"Climate Action",
description:"Championing environmental conservation and sustainable communities.",
},

{
icon:<FaWater />,
title:"Blue Economy",
description:"Unlocking opportunities in marine resources and coastal livelihoods.",
},

{
icon:<FaBriefcase />,
title:"Entrepreneurship",
description:"Supporting youth businesses, innovation and job creation.",
},

{
icon:<FaLightbulb />,
title:"Innovation",
description:"Encouraging creativity, technology and youth-driven solutions.",
},

{
icon:<FaGraduationCap />,
title:"Education & Skills",
description:"Connecting young people with training, scholarships and mentorship.",
},

];

function Impact(){

return(

<section className="impact">

<div className="impact-container">

<div className="section-title">

<span>OUR AREAS OF IMPACT</span>

<h2>

Creating Opportunities.
Inspiring Change.

</h2>

<p>

Everything we do is designed to empower
young people with knowledge, opportunities,
skills and networks for sustainable development.

</p>

</div>

<div className="impact-grid">

{impacts.map((item,index)=>(

<div className="impact-card" key={index}>

<div className="impact-icon">

{item.icon}

</div>

<h3>{item.title}</h3>

<p>{item.description}</p>

<a href="/programs">

Learn More →

</a>

</div>

))}

</div>

</div>

</section>

);

}

export default Impact;
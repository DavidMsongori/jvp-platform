import "./LeadershipStructure.css";

import {
  FaUserTie,
  FaUsers,
  FaBuilding,
  FaSitemap,
  FaPeopleArrows,
} from "react-icons/fa";

const structure = [

{
icon:<FaUserTie />,
title:"President",
description:"Provides strategic leadership and represents the organization regionally and nationally.",
},

{
icon:<FaBuilding />,
title:"Regional Executive Committee",
description:"Coordinates programmes, partnerships and strategic implementation across the Coast Region.",
},

{
icon:<FaSitemap />,
title:"County Leadership",
description:"Leads county chapters and ensures local implementation of JVP programmes and activities.",
},

{
icon:<FaPeopleArrows />,
title:"Youth Assembly",
description:"Provides representation, participation and policy engagement for young people.",
},

{
icon:<FaUsers />,
title:"General Membership",
description:"The foundation of JVP, driving community impact through active participation and volunteerism.",
},

];

function LeadershipStructure(){

return(

<section className="leadership">

<div className="leadership-container">

<div className="section-title">

<span>OUR LEADERSHIP</span>

<h2>

A Structure Built for
Service & Impact

</h2>

<p>

JVP is built on transparent leadership,
strong governance and active youth participation
across Kenya's six coastal counties.

</p>

</div>

<div className="structure">

{structure.map((item,index)=>(

<div className="structure-item" key={index}>

<div className="structure-icon">

{item.icon}

</div>

<div className="structure-card">

<h3>{item.title}</h3>

<p>{item.description}</p>

</div>

</div>

))}

</div>

</div>

</section>

);

}

export default LeadershipStructure;
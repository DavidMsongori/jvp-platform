import "./Counties.css";

import {
  FaMapMarkerAlt,
  FaUsers,
  FaLeaf,
} from "react-icons/fa";

const counties = [

{
name:"Mombasa",
description:"The commercial hub of Kenya's Coast Region.",
},

{
name:"Kilifi",
description:"Home of innovation, tourism and the Coastal Youth Summit.",
},

{
name:"Kwale",
description:"Empowering youth through entrepreneurship and community development.",
},

{
name:"Tana River",
description:"Building opportunities through agriculture and environmental conservation.",
},

{
name:"Lamu",
description:"Promoting culture, heritage and the Blue Economy.",
},

{
name:"Taita Taveta",
description:"Connecting youth through leadership and sustainable development.",
},

];

function Counties(){

return(

<section className="counties">

<div className="counties-container">

<div className="section-title">

<span>SERVING THE COAST REGION</span>

<h2>

One Movement. Six Counties.

</h2>

<p>

JVP proudly brings together young people from all six coastal counties,
creating opportunities for collaboration, leadership and sustainable development.

</p>

</div>

<div className="counties-grid">

{counties.map((county,index)=>(

<div className="county-card" key={index}>

<div className="county-icon">

<FaMapMarkerAlt/>

</div>

<h3>{county.name}</h3>

<p>{county.description}</p>

<div className="county-stats">

<div>

<FaUsers/>

<span>Growing Membership</span>

</div>

<div>

<FaLeaf/>

<span>Active Projects</span>

</div>

</div>

</div>

))}

</div>

</div>

</section>

);

}

export default Counties;
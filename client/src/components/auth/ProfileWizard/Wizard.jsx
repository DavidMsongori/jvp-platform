import { useState } from "react";

import ProgressBar from "./ProgressBar";

import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";

import "./Wizard.css";

function Wizard(){

const [step,setStep]=useState(1);

return(

<div className="wizard">

<ProgressBar

step={step}

/>

{step===1 &&

<StepOne

next={()=>setStep(2)}

/>

}

{step===2 &&

<StepTwo

next={()=>setStep(3)}

back={()=>setStep(1)}

/>

}

{step===3 &&

<StepThree

next={()=>setStep(4)}

back={()=>setStep(2)}

/>

}

{step===4 &&

<StepFour

back={()=>setStep(3)}

/>

}

</div>

);

}

export default Wizard;
import "./Wizard.css";

function ProgressBar({ step }) {

    const steps = [

        "Personal",

        "Education",

        "Skills",

        "Security",

    ];

    return (

        <div className="wizard-progress">

            {steps.map((title,index)=>(

                <div

                    key={index}

                    className={

                        step >= index+1

                        ? "wizard-step active"

                        : "wizard-step"

                    }

                >

                    <div>

                        {index+1}

                    </div>

                    <span>

                        {title}

                    </span>

                </div>

            ))}

        </div>

    );

}

export default ProgressBar;
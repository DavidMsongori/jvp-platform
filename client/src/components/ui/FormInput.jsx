import "./Form.css";

function FormInput({

    label,

    icon,

    type = "text",

    placeholder,

    value,

    onChange,

    required = false,

}) {

    return (

        <div className="form-control">

            {label &&

                <label>

                    {label}

                </label>

            }

            <div className="form-input">

                {icon &&

                    <span className="form-icon">

                        {icon}

                    </span>

                }

                <input

                    type={type}

                    placeholder={placeholder}

                    value={value}

                    onChange={onChange}

                    required={required}

                />

            </div>

        </div>

    );

}

export default FormInput;
import "./Form.css";

function FormSelect({

    label,

    value,

    onChange,

    options,

}) {

    return (

        <div className="form-control">

            <label>

                {label}

            </label>

            <select

                value={value}

                onChange={onChange}

            >

                {options.map((item,index)=>(

                    <option

                        key={index}

                        value={item.value}

                    >

                        {item.label}

                    </option>

                ))}

            </select>

        </div>

    );

}

export default FormSelect;
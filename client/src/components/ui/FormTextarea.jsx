import "./Form.css";

function FormTextarea({

    label,

    value,

    onChange,

    placeholder,

}){

    return(

        <div className="form-control">

            <label>

                {label}

            </label>

            <textarea

                rows={5}

                value={value}

                onChange={onChange}

                placeholder={placeholder}

            />

        </div>

    );

}

export default FormTextarea;
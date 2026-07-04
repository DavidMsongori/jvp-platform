import "./PageHero.css";

function PageHero({

    title,

    subtitle,

    image,

    breadcrumb,

}){

    return(

        <section
            className="page-hero"
            style={{
                backgroundImage:`url(${image})`,
            }}
        >

            <div className="page-overlay"></div>

            <div className="page-hero-content">

                <span>

                    {breadcrumb}

                </span>

                <h1>

                    {title}

                </h1>

                <p>

                    {subtitle}

                </p>

            </div>

        </section>

    );

}

export default PageHero;
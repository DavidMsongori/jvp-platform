import "./AuthHero.css";

import logo from "../../assets/logo.png";

import hero from "../../assets/auth/auth-bg.jpg";

function AuthHero() {

  return (

    <section
      className="auth-hero"
      style={{
        backgroundImage: `url(${hero})`,
      }}
    >

      <div className="auth-overlay"></div>

      <div className="auth-content">

        <img
          src={logo}
          alt="JVP"
        />

        <h1>

          Welcome to
          <br />

          JVP Connect

        </h1>

        <p>

          Connecting and empowering
          young people across Kenya's
          Coast Region.

        </p>

        <div className="auth-stats">

          <div>

            <h2>20,000+</h2>

            <span>Youth Reached</span>

          </div>

          <div>

            <h2>6</h2>

            <span>Counties</span>

          </div>

          <div>

            <h2>500+</h2>

            <span>Volunteers</span>

          </div>

        </div>

      </div>

    </section>

  );

}

export default AuthHero;
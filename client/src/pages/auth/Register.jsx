import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import RegisterForm from "../../components/auth/RegisterForm";

import "./Register.css";

function Register() {
  return (
    <div className="register-page">
      <Navbar />

      <main className="register-main">
        <div className="register-container">
          <div className="register-intro">
            <span className="register-intro__eyebrow">
              JOIN JVP CONNECT
            </span>

            <h1>
              Your Voice. Your Community.{" "}
              <span>Your Future.</span>
            </h1>

            <p>
              Create your JVP account and become part of a
              growing community of young people across the
              Coast Region.
            </p>
          </div>

          <div className="register-card">
            <RegisterForm />
          </div>

          <div className="register-login">
            <span>Already have a JVP Connect account?</span>

            <a href="/login">
              Sign in to JVP Connect
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Register;
import AuthLayout from "../../layouts/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";

function Login() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account."
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default Login;
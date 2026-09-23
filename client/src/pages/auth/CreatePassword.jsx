import AuthLayout from "../../layouts/AuthLayout";
import CreatePasswordForm from "../../components/auth/CreatePasswordForm";

function CreatePassword() {
  return (
    <AuthLayout
      title="Create Password"
      subtitle="Secure your JVP Connect account."
    >
      <CreatePasswordForm />
    </AuthLayout>
  );
}

export default CreatePassword;
import AuthLayout from "../../layouts/AuthLayout";
import ActivateMembershipForm from "../../components/auth/ActivateMembershipForm";

function ActivateMembership() {
  return (
    <AuthLayout
      title="Activate Your JVP Connect Account"
      subtitle="If you are an existing JVP member, use your membership details to activate your online account."
    >
      <div className="activation-info">

        <h3>
          Existing JVP Members
        </h3>

        <p>
          Your existing JVP membership can be
          connected to JVP Connect without
          registering again.
        </p>

        <p>
          Enter the phone number you used
          during your JVP membership
          registration together with the
          default password provided for
          existing members.
        </p>

        <p>
          After your membership is verified,
          you will be asked to provide your
          email address and create a new
          password for your JVP Connect
          account.
        </p>

      </div>

      <ActivateMembershipForm />
    </AuthLayout>
  );
}

export default ActivateMembership;
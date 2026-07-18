import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisVertical,
  FaEye,
  FaCheck,
  FaDownload,
  FaUser,
} from "react-icons/fa6";

function PaymentActions({
  payment,
  onView,
  onVerify,
  onMember,
  onDownload,
}) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () =>
      document.removeEventListener(
        "mousedown",
        close
      );
  }, []);

  return (
    <div
      className="actions-menu"
      ref={menuRef}
    >
      <button
        className="actions-trigger"
        onClick={() => setOpen(!open)}
      >
        <FaEllipsisVertical />
      </button>

      {open && (
        <div className="actions-dropdown">
          <button
            onClick={() => {
              setOpen(false);
              onView(payment);
            }}
          >
            <FaEye />
            View Receipt
          </button>

          {payment.status !==
            "completed" && (
            <button
              onClick={() => {
                setOpen(false);
                onVerify(payment);
              }}
            >
              <FaCheck />
              Verify Payment
            </button>
          )}

          <button
            onClick={() => {
              setOpen(false);
              onMember(payment);
            }}
          >
            <FaUser />
            Member Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onDownload(payment);
            }}
          >
            <FaDownload />
            Download Receipt
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentActions;
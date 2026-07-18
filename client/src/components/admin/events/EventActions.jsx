import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisVertical,
  FaEye,
  FaPen,
  FaUsers,
  FaTrash,
} from "react-icons/fa6";

function EventActions({
  event,
  onView,
  onEdit,
  onRegistrations,
  onDelete,
}) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeMenu
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        closeMenu
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
              onView(event);
            }}
          >
            <FaEye />
            View Event
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onEdit(event);
            }}
          >
            <FaPen />
            Edit Event
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onRegistrations(event);
            }}
          >
            <FaUsers />
            Registrations
          </button>

          <button
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete(event);
            }}
          >
            <FaTrash />
            Delete Event
          </button>
        </div>
      )}
    </div>
  );
}

export default EventActions;
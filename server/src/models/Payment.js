import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    /* ==========================================
       MEMBER
    ========================================== */

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

event: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Event",
  default: null,
},

registration: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Registration",
  default: null,
},

    /* ==========================================
       PAYMENT DETAILS
    ========================================== */

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    gatewayReference: {
      type: String,
      default: null,
      trim: true,
    },

    paymentFor: {
      type: String,
      enum: [
        "membership",
        "renewal",
        "event",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "KES",
      uppercase: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "mpesa",
        "card",
        "bank",
        "cash",
      ],
      required: true,
    },

    /* ==========================================
       STATUS
    ========================================== */

    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "failed",
      ],
      default: "pending",
    },

    /* ==========================================
       GATEWAY RESPONSE
    ========================================== */

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

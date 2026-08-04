import mongoose from "mongoose";

/* ==========================================
   CONSTANTS
========================================== */

const PAYMENT_FOR = [
  "membership",
  "renewal",
  "event",
  "summit",
   "summit_exhibitor",
  "donation",
];

const PAYMENT_METHODS = [
  "mpesa",
  "card",
  "bank",
  "cash",
  "unknown",
];

const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "successful",
  "failed",
  "cancelled",
  "expired",
  "refunded",
];

const PAYMENT_PROVIDERS = [
  "intasend",
  "mpesa_direct",
  "manual",
];

/* ==========================================
   PAYMENT SCHEMA
========================================== */

const paymentSchema = new mongoose.Schema(
  {
    /* ==========================================
       PAYMENT OWNER
    ========================================== */

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ==========================================
       EVENT / REGISTRATION
    ========================================== */

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },

    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
      index: true,
    },

    summitRegistration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SummitRegistration",
      default: null,
      index: true,
    },

    summitExhibitor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "SummitExhibitor",
  default: null,
  index: true,
},

    /* ==========================================
       INTERNAL REFERENCES
    ========================================== */

    reference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    accountReference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    paymentFor: {
      type: String,
      enum: PAYMENT_FOR,
      required: true,
      index: true,
    },

    /* ==========================================
       AMOUNT
    ========================================== */

    amount: {
      type: Number,
      required: true,
      min: [1, "Payment amount must be at least KES 1."],
    },

    currency: {
      type: String,
      default: "KES",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },

    /* ==========================================
       PAYMENT METHOD
    ========================================== */
    provider: {
  type: String,
  enum: PAYMENT_PROVIDERS,
  default: "intasend",
  required: true,
  index: true,
},

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "unknown",
      required: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    /* ==========================================
       PAYMENT STATUS
    ========================================== */

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },

    statusMessage: {
      type: String,
      default: null,
      trim: true,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    /* ==========================================
       M-PESA STK PUSH DETAILS
    ========================================== */

    mpesa: {
      merchantRequestId: {
        type: String,
        default: null,
        trim: true,
        index: true,
      },

      checkoutRequestId: {
        type: String,
        default: null,
        trim: true,

      },

      receiptNumber: {
        type: String,
        default: undefined,
        uppercase: true,
        trim: true,
  
      },

      resultCode: {
        type: Number,
        default: null,
      },

      resultDescription: {
        type: String,
        default: null,
        trim: true,
      },

      responseCode: {
        type: String,
        default: null,
        trim: true,
      },

      responseDescription: {
        type: String,
        default: null,
        trim: true,
      },

      customerMessage: {
        type: String,
        default: null,
        trim: true,
      },

      transactionDate: {
        type: Date,
        default: null,
      },

      transactionType: {
        type: String,
        enum: [
          "CustomerPayBillOnline",
          "CustomerBuyGoodsOnline",
          null,
        ],
        default: null,
      },

      businessShortCode: {
        type: String,
        default: null,
        trim: true,
      },

      callbackReceived: {
        type: Boolean,
        default: false,
      },

      callbackReceivedAt: {
        type: Date,
        default: null,
      },

      queryAttempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastQueryAt: {
        type: Date,
        default: null,
      },
    },

    /* ==========================================
   INTASEND DETAILS
========================================== */

intasend: {
  invoiceId: {
    type: String,
    default: null,
    trim: true,
  },

  apiReference: {
    type: String,
    default: null,
    uppercase: true,
    trim: true,
  },

  checkoutUrl: {
    type: String,
    default: null,
    trim: true,
  },

  state: {
    type: String,
    enum: [
      "PENDING",
      "PROCESSING",
      "COMPLETE",
      "FAILED",
      null,
    ],
    default: null,
  },

  provider: {
    type: String,
    default: null,
    trim: true,
  },

  providerReference: {
    type: String,
    default: null,
    trim: true,
    index: true,
  },

  charges: {
    type: Number,
    default: 0,
    min: 0,
  },

  netAmount: {
    type: Number,
    default: null,
    min: 0,
  },

  failedReason: {
    type: String,
    default: null,
    trim: true,
  },

  failedCode: {
    type: String,
    default: null,
    trim: true,
  },

  webhookReceived: {
    type: Boolean,
    default: false,
  },

  webhookReceivedAt: {
    type: Date,
    default: null,
  },

  statusQueryAttempts: {
    type: Number,
    default: 0,
    min: 0,
  },

  lastStatusQueryAt: {
    type: Date,
    default: null,
  },
},

    /* ==========================================
       GATEWAY DETAILS
    ========================================== */

    gatewayReference: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },

    callbackPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },

    /* ==========================================
       PROCESSING DATES
    ========================================== */

    initiatedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    /* ==========================================
       VERIFICATION
    ========================================== */

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verificationMethod: {
  type: String,
  enum: [
    "webhook",
    "status_query",
    "callback",
    "stk_query",
    "manual",
    null,
  ],
  default: null,
},

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ==========================================
       MEMBERSHIP PROCESSING
    ========================================== */

    membershipProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    membershipProcessedAt: {
      type: Date,
      default: null,
    },

    membershipProcessingError: {
      type: String,
      default: null,
      trim: true,
    },

    /* ==========================================
       EVENT / TICKET PROCESSING
    ========================================== */

    registrationProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    registrationProcessedAt: {
      type: Date,
      default: null,
    },

    ticketGenerated: {
      type: Boolean,
      default: false,
    },

    ticketGeneratedAt: {
      type: Date,
      default: null,
    },

    /* ==========================================
       RECEIPT
    ========================================== */
    receiptSent: {
      type: Boolean,
      default: false,
    },

    receiptSentAt: {
      type: Date,
      default: null,
    },

    receiptEmailAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ==========================================
       AUDIT
    ========================================== */

    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform(_document, returnedObject) {
        delete returnedObject.gatewayResponse;
        delete returnedObject.callbackPayload;
        return returnedObject;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

/* ==========================================
   INDEXES
========================================== */

paymentSchema.index({
  member: 1,
  createdAt: -1,
});

paymentSchema.index({
  status: 1,
  createdAt: -1,
});

paymentSchema.index({
  paymentFor: 1,
  status: 1,
});

paymentSchema.index({
  "mpesa.checkoutRequestId": 1,
});

paymentSchema.index(
  {
    "mpesa.receiptNumber": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      "mpesa.receiptNumber": {
        $type: "string",
      },
    },
  }
);

paymentSchema.index({
  event: 1,
  status: 1,
});

paymentSchema.index({
  summitRegistration: 1,
  status: 1,
});

paymentSchema.index({
  "intasend.invoiceId": 1,
});

paymentSchema.index({
  "intasend.apiReference": 1,
});

paymentSchema.index({
  summitExhibitor: 1,
  status: 1,
});

/* ==========================================
   VIRTUALS
========================================== */

paymentSchema.virtual("isPending").get(function () {
  return (
    this.status === "pending" ||
    this.status === "processing"
  );
});

paymentSchema.virtual("isSuccessful").get(function () {
  return this.status === "successful";
});

paymentSchema.virtual("isFailed").get(function () {
  return [
    "failed",
    "cancelled",
    "expired",
  ].includes(this.status);
});

/* ==========================================
   VALIDATION
========================================== */

paymentSchema.pre("validate", function (next) {
  if (
  this.paymentMethod === "mpesa" &&
  !this.phoneNumber
) {
  return next(
    new Error(
      "Phone number is required for M-Pesa payments."
    )
  );
}

  if (
    this.paymentFor === "event" &&
    !this.event &&
    !this.registration
  ) {
    return next(
      new Error(
        "An event payment must be linked to an event or registration."
      )
    );
  }

  if (
    this.paymentFor === "summit" &&
    !this.summitRegistration
  ) {
    return next(
      new Error(
        "A summit payment must be linked to a summit registration."
      )
    );
  }

if (
  this.paymentFor ===
    "summit_exhibitor" &&
  !this.summitExhibitor
) {
  return next(
    new Error(
      "A summit exhibitor payment must be linked to an exhibitor registration."
    )
  );
}


  if (
    ["membership", "renewal"].includes(
      this.paymentFor
    ) &&
    !this.member
  ) {
    return next(
      new Error(
        "Membership payments must be linked to a member."
      )
    );
  }

});

/* ==========================================
   INSTANCE METHODS
========================================== */

paymentSchema.methods.markAsProcessing = function ({
  merchantRequestId,
  checkoutRequestId,
  responseCode,
  responseDescription,
  customerMessage,
  gatewayResponse,
}) {
  this.status = "processing";
  this.initiatedAt = new Date();

  this.mpesa.merchantRequestId =
    merchantRequestId || null;

  this.mpesa.checkoutRequestId =
    checkoutRequestId || null;

  this.mpesa.responseCode =
    responseCode || null;

  this.mpesa.responseDescription =
    responseDescription || null;

  this.mpesa.customerMessage =
    customerMessage || null;

  this.gatewayResponse =
    gatewayResponse || null;

  return this.save();
};

paymentSchema.methods.markAsSuccessful = function ({
  receiptNumber,
  transactionDate,
  resultCode = 0,
  resultDescription,
  callbackPayload,
  verificationMethod = "callback",
}) {
  const now = new Date();

  this.status = "successful";
  this.statusMessage =
    resultDescription || "Payment completed successfully.";

  this.failureReason = null;

 if (receiptNumber) {
  this.mpesa.receiptNumber =
    receiptNumber.toUpperCase();

  this.gatewayReference =
    receiptNumber.toUpperCase();
}

this.mpesa.transactionDate =
  transactionDate || now;

this.mpesa.resultCode = resultCode;

this.mpesa.resultDescription =
  resultDescription || null;

if (verificationMethod === "callback") {
  this.mpesa.callbackReceived = true;
  this.mpesa.callbackReceivedAt = now;

  this.callbackPayload =
    callbackPayload || this.callbackPayload;
}

  this.paidAt = transactionDate || now;
  this.verifiedAt = now;

  this.isVerified = true;
  this.verificationMethod = verificationMethod;

  return this.save();
};

paymentSchema.methods.markAsFailed = function ({
  resultCode,
  resultDescription,
  callbackPayload,
}) {
  const now = new Date();

  this.status = "failed";

  this.failureReason =
    resultDescription ||
    "The M-Pesa payment was not completed.";

  this.statusMessage = this.failureReason;

  this.mpesa.resultCode =
    resultCode ?? null;

  this.mpesa.resultDescription =
    resultDescription || null;

  this.mpesa.callbackReceived = true;
  this.mpesa.callbackReceivedAt = now;

  this.callbackPayload =
    callbackPayload || this.callbackPayload;

  this.failedAt = now;

  return this.save();
};

paymentSchema.methods.markIntaSendProcessing =
  function ({
    invoiceId,
    apiReference,
    checkoutUrl,
    state = "PROCESSING",
    provider,
    gatewayResponse,
  }) {
    this.provider = "intasend";
    this.status = "processing";
    this.initiatedAt =
      this.initiatedAt || new Date();

    this.intasend.invoiceId =
      invoiceId || null;

    this.intasend.apiReference =
      apiReference || this.reference;

    this.intasend.checkoutUrl =
      checkoutUrl || null;

    this.intasend.state =
      state;

    this.intasend.provider =
      provider || null;

    this.gatewayReference =
      invoiceId || null;

    this.gatewayResponse =
      gatewayResponse || null;

    return this.save();
  };

  paymentSchema.methods.markIntaSendSuccessful =
  function ({
    invoiceId,
    providerReference,
    provider,
    charges = 0,
    netAmount,
    callbackPayload,
    paidAt,
    verificationMethod = "webhook",
  }) {
    const now = new Date();

    this.provider = "intasend";
    this.status = "successful";

    this.statusMessage =
      "Payment completed successfully.";

    this.failureReason = null;

    this.intasend.invoiceId =
      invoiceId ||
      this.intasend.invoiceId;

    this.intasend.state =
      "COMPLETE";

    this.intasend.provider =
      provider || null;

    this.intasend.providerReference =
      providerReference || null;

    this.intasend.charges =
      Number(charges) || 0;

    this.intasend.netAmount =
      netAmount !== undefined &&
      netAmount !== null
        ? Number(netAmount)
        : null;

    this.intasend.webhookReceived =
      verificationMethod ===
      "webhook";

    this.intasend.webhookReceivedAt =
      verificationMethod ===
      "webhook"
        ? now
        : this.intasend
            .webhookReceivedAt;

    this.gatewayReference =
      providerReference ||
      invoiceId ||
      this.gatewayReference;

    this.callbackPayload =
      callbackPayload ||
      this.callbackPayload;

    this.paidAt =
      paidAt || now;

    this.verifiedAt = now;
    this.isVerified = true;
    this.verificationMethod =
      verificationMethod;

    return this.save();
  };

  paymentSchema.methods.markIntaSendFailed =
  function ({
    invoiceId,
    failedReason,
    failedCode,
    callbackPayload,
  }) {
    const now = new Date();

    this.provider = "intasend";
    this.status = "failed";

    this.failureReason =
      failedReason ||
      "The IntaSend payment was not completed.";

    this.statusMessage =
      this.failureReason;

    this.intasend.invoiceId =
      invoiceId ||
      this.intasend.invoiceId;

    this.intasend.state =
      "FAILED";

    this.intasend.failedReason =
      failedReason || null;

    this.intasend.failedCode =
      failedCode || null;

    this.intasend.webhookReceived =
      true;

    this.intasend.webhookReceivedAt =
      now;

    this.callbackPayload =
      callbackPayload ||
      this.callbackPayload;

    this.failedAt = now;

    return this.save();
  };

/* ==========================================
   STATIC METHODS
========================================== */

paymentSchema.statics.findByCheckoutRequestId =
  function (checkoutRequestId) {
    return this.findOne({
      "mpesa.checkoutRequestId": checkoutRequestId,
    });
  };

paymentSchema.statics.findByMpesaReceipt =
  function (receiptNumber) {
    return this.findOne({
      "mpesa.receiptNumber":
        receiptNumber?.toUpperCase(),
    });
  };


  paymentSchema.statics.findByIntaSendInvoiceId =
  function (invoiceId) {
    return this.findOne({
      "intasend.invoiceId":
        invoiceId,
    });
  };

paymentSchema.statics.findByIntaSendApiReference =
  function (apiReference) {
    return this.findOne({
      "intasend.apiReference":
        apiReference
          ?.trim()
          .toUpperCase(),
    });
  };

/* ==========================================
   MODEL
========================================== */

const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);

export {
  PAYMENT_FOR,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_PROVIDERS,
};

export default Payment;
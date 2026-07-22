import Leader from "../models/leader.model.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import Member from "../models/Member.js";


import {
  LEADERSHIP_LEVELS,
  LEADERSHIP_STATUS,
} from "../constants/leadership.constants.js";

import {
  normalizeCounty,
  normalizeConstituency,
  normalizeWard,
  isValidCounty,
  isValidConstituency,
  isValidWard,
} from "../utils/geography.utils.js";

import {
  normalizePosition,
  isValidOffice,
  getOfficeConfiguration,
} from "../utils/leadership.utils.js";

/* ===========================================================
   MEMBER POPULATE
=========================================================== */

const MEMBER_POPULATE = `
  memberNumber
  firstName
  middleName
  lastName
  profilePhoto
  county
  constituency
  ward
  gender
  membershipStatus
`;

/* ===========================================================
   LEADER SERVICE
=========================================================== */

class LeaderService {

  /* =========================================================
     PRIVATE HELPERS
  ========================================================= */

  /**
   * Populate leader with member details.
   */
  async populateLeader(id) {
    return Leader.findById(id)
      .populate("member", MEMBER_POPULATE);
  }

  /**
   * Find leader by ID or throw AppError.
   */
  async findLeader(id) {
    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError(404, "Leader not found.");
    }

    return leader;
  }

  /**
   * Ensure a member does not already hold
   * another active leadership office.
   */
  async validateMemberAssignment(
    memberId,
    ignoreLeaderId = null
  ) {

    if (!memberId) return;

    const query = {
      member: memberId,
      isActive: true,
    };

    if (ignoreLeaderId) {
      query._id = {
        $ne: ignoreLeaderId,
      };
    }

    const existing = await Leader.findOne(query);

    if (existing) {
      throw new AppError(
        409,
        "This member already has an active leadership assignment."
      );
    }

  }

  /**
   * Validate leadership office.
   */
  validateOffice(position) {

    const office = normalizePosition(position);

    if (!isValidOffice(office)) {
      throw new AppError(
        400,
        "Invalid leadership office."
      );
    }

    return office;

  }

  /**
   * Validate leadership geography
   * according to office scope.
   */
  validateLocation(
    position,
    county,
    constituency,
    ward
  ) {

    const office = getOfficeConfiguration(position);

    if (!office) {
      throw new AppError(
        400,
        "Unknown leadership office."
      );
    }

    switch (office.scope) {

      case "regional":
        return {
          county: null,
          constituency: null,
          ward: null,
        };

      case "county":

        if (!isValidCounty(county)) {
          throw new AppError(
            400,
            "Invalid county."
          );
        }

        return {
          county: normalizeCounty(county),
          constituency: null,
          ward: null,
        };

      case "constituency":

        if (!isValidCounty(county)) {
          throw new AppError(
            400,
            "Invalid county."
          );
        }

        if (
          !isValidConstituency(
            county,
            constituency
          )
        ) {
          throw new AppError(
            400,
            "Invalid constituency."
          );
        }

        return {
          county: normalizeCounty(county),
          constituency: normalizeConstituency(
            county,
            constituency
          ),
          ward: null,
        };

      case "ward":

        if (!isValidCounty(county)) {
          throw new AppError(
            400,
            "Invalid county."
          );
        }

        if (
          !isValidConstituency(
            county,
            constituency
          )
        ) {
          throw new AppError(
            400,
            "Invalid constituency."
          );
        }

        if (
          !isValidWard(
            county,
            constituency,
            ward
          )
        ) {
          throw new AppError(
            400,
            "Invalid ward."
          );
        }

        return {
          county: normalizeCounty(county),
          constituency: normalizeConstituency(
            county,
            constituency
          ),
          ward: normalizeWard(
            county,
            constituency,
            ward
          ),
        };

      default:
        return {
          county,
          constituency,
          ward,
        };

    }

  }
  /* =========================================================
     CREATE LEADER
  ========================================================= */

  async createLeader(data, userId) {

    await this.validateMemberAssignment(data.member);

    const position = this.validateOffice(data.position);

    const location = this.validateLocation(
      position,
      data.county,
      data.constituency,
      data.ward
    );
    const office =
  getOfficeConfiguration(position);

if (!office) {
  throw new AppError(
    400,
    "Invalid leadership office."
  );
}

    const leader = await Leader.create({
  ...data,

  position,

  category: office.level,
  department: office.department,
  scope: office.scope,
  appointmentType: office.appointmentType,

  county: location.county,
  constituency: location.constituency,
  ward: location.ward,

  createdBy: userId,
  updatedBy: userId,
});

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     GET ALL LEADERS
  ========================================================= */

  async getLeaders(filters = {}) {

    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.position) {
      query.position = normalizePosition(filters.position);
    }

    if (filters.county) {
      query.county = normalizeCounty(filters.county);
    }

    if (filters.constituency && filters.county) {
      query.constituency = normalizeConstituency(
        filters.county,
        filters.constituency
      );
    }

    if (
      filters.ward &&
      filters.county &&
      filters.constituency
    ) {
      query.ward = normalizeWard(
        filters.county,
        filters.constituency,
        filters.ward
      );
    }

    if (filters.member) {
      query.member = filters.member;
    }

    if (filters.active !== undefined) {
      query.isActive =
        filters.active === true ||
        filters.active === "true";
    }

    return Leader.find(query)
      .populate("member", MEMBER_POPULATE)
      .sort({
        category: 1,
        county: 1,
        displayOrder: 1,
        position: 1,
      });

  }

  /* =========================================================
     GET LEADER BY ID
  ========================================================= */

  async getLeaderById(id) {

    const leader = await this.populateLeader(id);

    if (!leader) {
      throw new AppError(404, "Leader not found.");
    }

    return leader;

  }

  /* =========================================================
     GET LEADER BY MEMBER
  ========================================================= */

  async getLeaderByMember(memberId) {

    return Leader.findOne({
      member: memberId,
      isActive: true,
    }).populate("member", MEMBER_POPULATE);

  }


/* =========================================================
   GET LEADERSHIP MEMBERS
========================================================= */

async getLeadershipMembers(userId, query = {}) {
    const {
  page = 1,
  limit = 20,
  search = "",
  membershipStatus,
  membershipType,
  sort = "-createdAt",
} = query;

const member = await Member.findOne({
  user: userId,
});

if (!member) {
  throw new AppError(
    404,
    "Member account not found."
  );
}

const leader = await Leader.findOne({
  member: member._id,
  isActive: true,
});

if (!leader) {
  throw new AppError(
    403,
    "You are not an active leader."
  );
}

const filter = {};

/* =========================================================
   ONLY ACCOUNT-ACTIVATED MEMBERS
========================================================= */

filter.accountActivated = true;

switch (leader.scope) {

  case "regional":
    // Regional leaders see all members.
    break;

  case "county":
    filter.county = leader.county;
    break;

  case "constituency":
    filter.county = leader.county;
    filter.constituency = leader.constituency;
    break;

  case "ward":
    filter.county = leader.county;
    filter.constituency = leader.constituency;
    filter.ward = leader.ward;
    break;

  default:
    throw new AppError(
      403,
      "Invalid leadership jurisdiction."
    );

}

if (membershipStatus) {
  filter.membershipStatus = membershipStatus;
}

if (membershipType) {
  filter.membershipType = membershipType;
}

if (search.trim()) {

  const regex = new RegExp(search.trim(), "i");

  filter.$or = [

    { memberNumber: regex },

    { firstName: regex },

    { middleName: regex },

    { lastName: regex },

    { phone: regex },

  ];

}
const [
  totalMembers,
  activeMembers,
  maleMembers,
  femaleMembers,
] = await Promise.all([

  Member.countDocuments(filter),

  Member.countDocuments({
    ...filter,
    membershipStatus: "active",
  }),

  Member.countDocuments({
    ...filter,
    gender: "male",
  }),

  Member.countDocuments({
    ...filter,
    gender: "female",
  }),

]);

const startOfMonth = new Date();

startOfMonth.setDate(1);

startOfMonth.setHours(0, 0, 0, 0);

const newMembersThisMonth =
  await Member.countDocuments({

    ...filter,

    createdAt: {
      $gte: startOfMonth,
    },

  });
  const summary = {

  totalMembers,

  activeMembers,

  maleMembers,

  femaleMembers,

  newMembersThisMonth,

};

let distribution = null;

let groupField = null;

let title = "";

switch (leader.scope) {

  case "regional":

    groupField = "$county";

    title = "County Distribution";

    break;

  case "county":

    groupField = "$constituency";

    title = "Constituency Distribution";

    break;

  case "constituency":

    groupField = "$ward";

    title = "Ward Distribution";

    break;

  case "ward":

    groupField = null;

    break;

}

if (groupField) {
    const graph = await Member.aggregate([
        {
  $match: filter,
},
{
  $group: {
    _id: groupField,
    members: {
      $sum: 1,
    },
  },
},
{
  $sort: {
    _id: 1,
  },
},
 ]);

  distribution = {
    title,
    data: graph.map((item) => ({
      name: item._id || "Unknown",
      members: item.members,
    })),
  };

  const currentPage = Math.max(Number(page), 1);

const pageSize = Math.max(Number(limit), 1);

const skip = (currentPage - 1) * pageSize;
const members = await Member.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(pageSize)
  .select([
    "memberNumber",
    "firstName",
    "middleName",
    "lastName",
    "gender",
    "phone",
    "county",
    "constituency",
    "ward",
    "membershipType",
    "membershipStatus",
    "membershipFeePaid",
    "profilePhoto",
    "profileCompletion",
    "joinedAt",
    "createdAt",
  ].join(" "))
  .lean();

  const pagination = {
  page: currentPage,
  limit: pageSize,
  total: totalMembers,
  totalPages: Math.ceil(totalMembers / pageSize),
  hasNextPage: currentPage < Math.ceil(totalMembers / pageSize),
  hasPreviousPage: currentPage > 1,
};

return {
  summary,
  distribution,
  members,
  pagination,
};

}



}


  /* =========================================================
     GET ACTIVE LEADERS
  ========================================================= */

  async getActiveLeaders() {

    return this.getLeaders({
      active: true,
    });

  }

  /* =========================================================
     GET INACTIVE LEADERS
  ========================================================= */

  async getInactiveLeaders() {

    return this.getLeaders({
      active: false,
    });

  }

  /* =========================================================
     GET LEADERS BY CATEGORY
  ========================================================= */

  async getLeadersByCategory(category) {

    return this.getLeaders({
      category,
      active: true,
    });

  }

  /* =========================================================
     GET LEADERS BY LEVEL
  ========================================================= */

  async getLeadersByLevel(level) {

    return Leader.find({
      category: level,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        displayOrder: 1,
        position: 1,
      });

  }

  /* =========================================================
     GET COUNTY LEADERS
  ========================================================= */

  async getCountyLeaders(county) {

    county = normalizeCounty(county);

    return this.getLeaders({
      county,
      active: true,
    });

  }

  /* =========================================================
     GET PUBLIC LEADERS
  ========================================================= */

  async getPublicLeaders() {

    return Leader.find({
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        category: 1,
        county: 1,
        displayOrder: 1,
        position: 1,
      });

  }

  /* =========================================================
     SEARCH LEADERS
  ========================================================= */

  async searchLeaders(search = "") {

    const term = search.trim();

    if (!term) {
      return this.getLeaders();
    }

    const regex = new RegExp(term, "i");

    return Leader.find({
      $or: [
        { position: regex },
        { category: regex },
        { county: regex },
        { constituency: regex },
        { ward: regex },
        { "patron.fullName": regex },
      ],
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        category: 1,
        displayOrder: 1,
        position: 1,
      });

  }
    /* =========================================================
     UPDATE LEADER
  ========================================================= */

  async updateLeader(id, updates, userId) {

    const leader = await this.findLeader(id);

    if (
      updates.member &&
      updates.member.toString() !== leader.member?.toString()
    ) {
      await this.validateMemberAssignment(
        updates.member,
        leader._id
      );
    }

    /*
     * Position changed?
     * Recalculate all derived values.
     */
    if (updates.position) {

      const position = this.validateOffice(
        updates.position
      );

      const office =
        getOfficeConfiguration(position);

      const location = this.validateLocation(
        position,
        updates.county ?? leader.county,
        updates.constituency ?? leader.constituency,
        updates.ward ?? leader.ward
      );

      updates.position = position;

      updates.category = office.level;
      updates.department = office.department;
      updates.scope = office.scope;
      updates.appointmentType =
        office.appointmentType;

      updates.county = location.county;
      updates.constituency =
        location.constituency;
      updates.ward = location.ward;
    }

    Object.assign(leader, updates);

    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     ACTIVATE LEADER
  ========================================================= */

  async activateLeader(id, userId) {

    const leader = await this.findLeader(id);

    leader.isActive = true;
    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     DEACTIVATE LEADER
  ========================================================= */

  async deactivateLeader(id, userId) {

    const leader = await this.findLeader(id);

    leader.isActive = false;
    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     COMPLETE LEADER TERM
  ========================================================= */

  async completeLeaderTerm(id, userId) {

    const leader = await this.findLeader(id);

    leader.status = "completed";
    leader.isActive = false;
    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     SUSPEND LEADER
  ========================================================= */

  async suspendLeader(id, userId) {

    const leader = await this.findLeader(id);

    leader.status = "suspended";
    leader.isActive = false;
    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     REINSTATE LEADER
  ========================================================= */

  async reinstateLeader(id, userId) {

    const leader = await this.findLeader(id);

    leader.status = "active";
    leader.isActive = true;
    leader.updatedBy = userId;

    await leader.save();

    return this.populateLeader(leader._id);

  }

  /* =========================================================
     DELETE LEADER
  ========================================================= */

  async deleteLeader(id) {

    const leader = await this.findLeader(id);

    await leader.deleteOne();

    return true;

  }

  /* =========================================================
     BULK ACTIVATE
  ========================================================= */

  async activateMany(ids = [], userId) {

    await Leader.updateMany(
      {
        _id: {
          $in: ids,
        },
      },
      {
        isActive: true,
        updatedBy: userId,
      }
    );

    return true;

  }

  /* =========================================================
     BULK DEACTIVATE
  ========================================================= */

  async deactivateMany(ids = [], userId) {

    await Leader.updateMany(
      {
        _id: {
          $in: ids,
        },
      },
      {
        isActive: false,
        updatedBy: userId,
      }
    );

    return true;

  }

    /* =========================================================
     LEADERSHIP STATISTICS
  ========================================================= */

  async getStatistics() {

    const [
      total,
      active,
      inactive,
      completed,
      suspended,
      regionalExecutive,
      councilOfGovernors,
      youthAssembly,
      countyLeadership,
    ] = await Promise.all([

      Leader.countDocuments(),

      Leader.countDocuments({
        isActive: true,
      }),

      Leader.countDocuments({
        isActive: false,
      }),

      Leader.countDocuments({
        status: "completed",
      }),

      Leader.countDocuments({
        status: "suspended",
      }),

      Leader.countDocuments({
        category: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
      }),

      Leader.countDocuments({
        category: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
      }),

      Leader.countDocuments({
        category: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
      }),

      Leader.countDocuments({
        category: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
      }),

    ]);

    return {

      overview: {
        total,
        active,
        inactive,
        completed,
        suspended,
      },

      levels: {
        regionalExecutive,
        councilOfGovernors,
        youthAssembly,
        countyLeadership,
      },

    };

  }

  /* =========================================================
     LEADERS BY COUNTY
  ========================================================= */

  async getCountyStatistics() {

    return Leader.aggregate([

      {
        $match: {
          isActive: true,
        },
      },

      {
        $group: {
          _id: "$county",
          total: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },

    ]);

  }

  /* =========================================================
     LEADERS BY POSITION
  ========================================================= */

  async getPositionStatistics() {

    return Leader.aggregate([

      {
        $match: {
          isActive: true,
        },
      },

      {
        $group: {
          _id: "$position",
          total: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },

    ]);

  }

  /* =========================================================
     LEADERS BY LEVEL
  ========================================================= */

  async getLevelStatistics() {

    return Leader.aggregate([

      {
        $group: {
          _id: "$category",
          total: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },

    ]);

  }

  /* =========================================================
     LEADERS BY GENDER
  ========================================================= */

  async getGenderStatistics() {

    return Leader.aggregate([

      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },

      {
        $unwind: "$member",
      },

      {
        $group: {
          _id: "$member.gender",
          total: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },

    ]);

  }

  /* =========================================================
     COMPLETE DASHBOARD
  ========================================================= */

  async getDashboardStatistics() {

    const [

      statistics,

      counties,

      positions,

      levels,

      gender,

    ] = await Promise.all([

      this.getStatistics(),

      this.getCountyStatistics(),

      this.getPositionStatistics(),

      this.getLevelStatistics(),

      this.getGenderStatistics(),

    ]);

    return {

      statistics,

      charts: {

        counties,

        positions,

        levels,

        gender,

      },

    };

  }
  /* =========================================================
     REGIONAL EXECUTIVE
  ========================================================= */

  async getRegionalExecutive() {

    return Leader.find({
      category: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        displayOrder: 1,
        position: 1,
      });

  }

  /* =========================================================
     COUNCIL OF GOVERNORS
  ========================================================= */

  async getCouncilOfGovernors() {

    return Leader.find({
      category: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        county: 1,
        displayOrder: 1,
      });

  }

  /* =========================================================
     YOUTH ASSEMBLY
  ========================================================= */

  async getYouthAssembly() {

    return Leader.find({
      category: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        county: 1,
        constituency: 1,
      });

  }

  /* =========================================================
     COUNTY LEADERSHIP
  ========================================================= */

  async getCountyLeadership() {

    return Leader.find({
      category: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        county: 1,
        constituency: 1,
        ward: 1,
      });

  }

  /* =========================================================
     LEADERS BY COUNTY
  ========================================================= */

  async getLeadershipByCounty(county) {

    county = normalizeCounty(county);

    return Leader.find({
      county,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        category: 1,
        displayOrder: 1,
      });

  }

  /* =========================================================
     LEADERS BY POSITION
  ========================================================= */

  async getLeadersByPosition(position) {

    position = normalizePosition(position);

    return Leader.find({
      position,
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE);

  }

  /* =========================================================
     LEADERSHIP DIRECTORY
  ========================================================= */

  async getLeadershipDirectory() {

    return Leader.find({
      isActive: true,
    })
      .populate("member", MEMBER_POPULATE)
      .sort({
        category: 1,
        county: 1,
        displayOrder: 1,
      });

  }

  /* =========================================================
     VACANT POSITIONS
  ========================================================= */

  async getVacantPositions() {

    const occupied = await Leader.find({
      isActive: true,
    }).select("position");

    const occupiedPositions = occupied.map(
      (leader) => leader.position
    );

    return LEADERSHIP_OFFICE_VALUES.filter(
      (office) => !occupiedPositions.includes(office)
    );

  }

  /* =========================================================
     VERIFY LEADERSHIP CARD
  ========================================================= */

  async verifyLeadershipCard(id) {

    const leader = await Leader.findById(id)
      .populate("member", MEMBER_POPULATE);

    if (!leader) {
      throw new AppError(
        404,
        "Leadership record not found."
      );
    }

    return {
      valid: leader.isActive,
      leader,
    };

  }

  /* =========================================================
     LEADERSHIP HIERARCHY
  ========================================================= */

  async getLeadershipHierarchy() {

    const [

      executive,

      governors,

      assembly,

      county,

    ] = await Promise.all([

      this.getRegionalExecutive(),

      this.getCouncilOfGovernors(),

      this.getYouthAssembly(),

      this.getCountyLeadership(),

    ]);

    return {

      regionalExecutive: executive,

      councilOfGovernors: governors,

      youthAssembly: assembly,

      countyLeadership: county,

    };

  }
}

  export default new LeaderService();

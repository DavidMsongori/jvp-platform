import mongoose from "mongoose";
import Leader from "../models/leader.model.js";
import AppError from "../utils/AppError.js";
import Member from "../models/Member.js";

import {
  LEADERSHIP_LEVELS,
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_SCOPE,
  LEADERSHIP_STATUS,
  LEADERSHIP_OFFICES,
  LEADERSHIP_OFFICE_VALUES,
  REPORT_VISIBILITY,
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


/* ========================================================================
   MEMBER POPULATE
======================================================================== */

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
  membershipType
`;


/* ========================================================================
   LEADER SERVICE
======================================================================== */

class LeaderService {

  /* ======================================================================
     PRIVATE HELPERS
  ====================================================================== */

  /**
   * Populate a leadership record with member details.
   *
   * Patron records may not have a Member account.
   */
  async populateLeader(id) {

    return Leader.findById(id)
      .populate("member", MEMBER_POPULATE);

  }


  /**
   * Find a leader or throw a 404 error.
   */
  async findLeader(id) {

    this.validateObjectId(id, "leader ID");

    const leader =
      await Leader.findById(id);

    if (!leader) {

      throw new AppError(
        404,
        "Leader not found."
      );

    }

    return leader;

  }


  /**
   * Validate MongoDB ObjectId.
   */
  validateObjectId(id, field = "ID") {

    if (
      !id ||
      !mongoose.isValidObjectId(id)
    ) {

      throw new AppError(
        400,
        `Invalid ${field}.`
      );

    }

    return true;

  }


  /**
   * Determine whether the office is Patronage.
   */
  isPatronPosition(position) {

    const office =
      this.getOffice(position);

    return (
      office.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE
    );

  }


  /**
   * Ensure a member does not already hold
   * another active leadership assignment.
   *
   * Patron does not require a Member.
   */
  async validateMemberAssignment(
    memberId,
    ignoreLeaderId = null
  ) {

    if (!memberId) {
      return;
    }

    this.validateObjectId(
      memberId,
      "member ID"
    );

    const query = {

      member: memberId,

      isActive: true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    };


    if (ignoreLeaderId) {

      query._id = {
        $ne: ignoreLeaderId,
      };

    }


    const existing =
      await Leader.findOne(query);


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

    const office =
      normalizePosition(position);

    if (!isValidOffice(office)) {

      throw new AppError(
        400,
        "Invalid leadership office."
      );

    }

    return office;

  }


  /**
   * Get office configuration.
   */
  getOffice(position) {

    const office =
      normalizePosition(position);

    const configuration =
      getOfficeConfiguration(office);

    if (!configuration) {

      throw new AppError(
        400,
        "Unknown leadership office."
      );

    }

    return configuration;

  }


  /**
   * Validate geographic jurisdiction according
   * to report visibility.
   *
   * Structural scope and geographic visibility
   * are intentionally separate.
   */
  validateLocation(
    position,
    county,
    constituency,
    ward
  ) {

    const office =
      this.getOffice(position);


    switch (
      office.reportVisibility
    ) {

      /* ================================================================
         PRIVATE
      ================================================================ */

      case REPORT_VISIBILITY.PRIVATE:

        return {

          county: null,

          constituency: null,

          ward: null,

        };


      /* ================================================================
         REGIONAL
      ================================================================ */

      case REPORT_VISIBILITY.REGIONAL:

        return {

          county: null,

          constituency: null,

          ward: null,

        };


      /* ================================================================
         COUNTY
      ================================================================ */

      case REPORT_VISIBILITY.COUNTY:

        if (!isValidCounty(county)) {

          throw new AppError(
            400,
            "Valid county is required for this leadership office."
          );

        }

        return {

          county:
            normalizeCounty(county),

          constituency: null,

          ward: null,

        };


      /* ================================================================
         CONSTITUENCY
      ================================================================ */

      case REPORT_VISIBILITY.CONSTITUENCY:

        if (!isValidCounty(county)) {

          throw new AppError(
            400,
            "Valid county is required."
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
            "Valid constituency is required."
          );

        }


        return {

          county:
            normalizeCounty(county),

          constituency:
            normalizeConstituency(
              county,
              constituency
            ),

          ward: null,

        };


      /* ================================================================
         WARD
      ================================================================ */

      case REPORT_VISIBILITY.WARD:

        if (!isValidCounty(county)) {

          throw new AppError(
            400,
            "Valid county is required."
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
            "Valid constituency is required."
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
            "Valid ward is required."
          );

        }


        return {

          county:
            normalizeCounty(county),

          constituency:
            normalizeConstituency(
              county,
              constituency
            ),

          ward:
            normalizeWard(
              county,
              constituency,
              ward
            ),

        };


      /* ================================================================
         INVALID
      ================================================================ */

      default:

        throw new AppError(
          400,
          "Invalid leadership reporting visibility."
        );

    }

  }


  /**
   * Build all derived leadership fields from
   * the central office configuration.
   *
   * The client should not be trusted to define
   * category, level, department, scope, visibility,
   * or appointment type independently.
   */
  buildOfficeFields(position) {

    const normalizedPosition =
      this.validateOffice(position);

    const office =
      this.getOffice(
        normalizedPosition
      );


    return {

      position:
        normalizedPosition,

      category:
        office.category,

      level:
        office.level,

      department:
        office.department,

      scope:
        office.scope,

      reportVisibility:
        office.reportVisibility,

      appointmentType:
        office.appointmentType,

    };

  }


  /**
   * Build geographic access filters from
   * the leader's report visibility.
   */
  buildJurisdictionFilter(leader) {

    if (!leader) {

      throw new AppError(
        403,
        "Leadership record not found."
      );

    }


    switch (
      leader.reportVisibility
    ) {

      case REPORT_VISIBILITY.REGIONAL:

        return {};


      case REPORT_VISIBILITY.COUNTY:

        if (!leader.county) {

          throw new AppError(
            403,
            "Leader does not have a county jurisdiction."
          );

        }

        return {

          county:
            leader.county,

        };


      case REPORT_VISIBILITY.CONSTITUENCY:

        if (
          !leader.county ||
          !leader.constituency
        ) {

          throw new AppError(
            403,
            "Leader does not have a constituency jurisdiction."
          );

        }

        return {

          county:
            leader.county,

          constituency:
            leader.constituency,

        };


      case REPORT_VISIBILITY.WARD:

        if (
          !leader.county ||
          !leader.constituency ||
          !leader.ward
        ) {

          throw new AppError(
            403,
            "Leader does not have a ward jurisdiction."
          );

        }

        return {

          county:
            leader.county,

          constituency:
            leader.constituency,

          ward:
            leader.ward,

        };


      case REPORT_VISIBILITY.PRIVATE:

        /*
         * No member records should be returned.
         */
        return {

          _id: {
            $exists: false,
          },

        };


      default:

        throw new AppError(
          403,
          "Invalid leadership reporting visibility."
        );

    }

  }


  /**
   * Determine whether an office can have
   * multiple active holders.
   *
   * These offices are portfolio/administrative
   * offices rather than single-seat offices.
   */
  officeAllowsMultiple(position) {

    return [

      LEADERSHIP_OFFICES.CABINET_SECRETARY,

      LEADERSHIP_OFFICES.COUNTY_CABINET_SECRETARY,

      LEADERSHIP_OFFICES.REGIONAL_CLERK,

      LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,

      LEADERSHIP_OFFICES.COUNTY_CLERK,

      LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK,

      LEADERSHIP_OFFICES.NOMINATED_MCA,

    ].includes(position);

  }


  /**
   * Build the jurisdiction portion of an
   * office uniqueness query.
   */
  buildOfficeJurisdictionQuery(
    location,
    reportVisibility
  ) {

    switch (reportVisibility) {

      case REPORT_VISIBILITY.REGIONAL:

      case REPORT_VISIBILITY.PRIVATE:

        return {

          county: null,

          constituency: null,

          ward: null,

        };


      case REPORT_VISIBILITY.COUNTY:

        return {

          county:
            location.county,

          constituency: null,

          ward: null,

        };


      case REPORT_VISIBILITY.CONSTITUENCY:

        return {

          county:
            location.county,

          constituency:
            location.constituency,

          ward: null,

        };


      case REPORT_VISIBILITY.WARD:

        return {

          county:
            location.county,

          constituency:
            location.constituency,

          ward:
            location.ward,

        };


      default:

        return {

          county:
            location.county || null,

          constituency:
            location.constituency || null,

          ward:
            location.ward || null,

        };

    }

  }


  /**
 * Prevent duplicate active office assignments
 * within the same jurisdiction.
 *
 * Regional offices are globally unique.
 * County offices are unique per county.
 * Constituency offices are unique per constituency.
 * Ward offices are unique per ward.
 *
 * Offices that legally allow multiple holders
 * are excluded from duplicate validation.
 */
async validateOfficeAssignment(
  position,
  location,
  ignoreLeaderId = null
) {
  const office = this.getOffice(position);

  /*
   * Some offices may legitimately have
   * multiple holders within the same jurisdiction.
   *
   * Example:
   * - Nominated MCA
   */
  if (this.officeAllowsMultiple(position)) {
    return;
  }

  const query = {
    position,

    isActive: true,

    status: LEADERSHIP_STATUS.ACTIVE,
  };

  if (ignoreLeaderId) {
    query._id = {
      $ne: ignoreLeaderId,
    };
  }

  Object.assign(
    query,
    this.buildOfficeJurisdictionQuery(
      location,
      office.reportVisibility
    )
  );

  const existing = await Leader.findOne(query);

  if (existing) {
    const jurisdiction =
      this.getJurisdictionLabel(existing);

    throw new AppError(
      409,
      `The ${position} office is already occupied${jurisdiction}.`
    );
  }
}


  /**
   * Generate a readable jurisdiction label
   * for duplicate-office errors.
   */
  getJurisdictionLabel(leader) {

    switch (
      leader.reportVisibility
    ) {

      case REPORT_VISIBILITY.REGIONAL:

        return " at the regional level";


      case REPORT_VISIBILITY.COUNTY:

        return ` in ${leader.county}`;


      case REPORT_VISIBILITY.CONSTITUENCY:

        return ` in ${leader.constituency}, ${leader.county}`;


      case REPORT_VISIBILITY.WARD:

        return ` in ${leader.ward}, ${leader.constituency}, ${leader.county}`;


      default:

        return "";

    }

  }


  /* ======================================================================
     CREATE LEADER
  ====================================================================== */

  async createLeader(
    data,
    userId
  ) {

    const position =
      this.validateOffice(
        data.position
      );

    const office =
      this.getOffice(position);


    /*
     * Patron:
     *
     * - no Member required
     * - no geography
     * - special model handling
     */
    if (
      office.category !==
      LEADERSHIP_CATEGORIES.PATRONAGE
    ) {

      if (!data.member) {

        throw new AppError(
          400,
          "A member is required for this leadership office."
        );

      }


      await this.validateMemberAssignment(
        data.member
      );

    }


    const location =
      this.validateLocation(

        position,

        data.county,

        data.constituency,

        data.ward

      );


    await this.validateOfficeAssignment(

      position,

      location

    );


    const officeFields =
      this.buildOfficeFields(
        position
      );


    const leader =
      await Leader.create({

        ...data,

        ...officeFields,

        county:
          location.county,

        constituency:
          location.constituency,

        ward:
          location.ward,

        status:
          data.status ||
          LEADERSHIP_STATUS.ACTIVE,

        isActive:
          data.isActive !== undefined
            ? data.isActive
            : true,

        createdBy:
          userId,

        updatedBy:
          userId,

      });


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     GET ALL LEADERS
  ====================================================================== */

  async getLeaders(
    filters = {}
  ) {

    const query = {};


    /* --------------------------------------------------------------------
       CATEGORY
    -------------------------------------------------------------------- */

    if (filters.category) {

      query.category =
        filters.category;

    }


    /* --------------------------------------------------------------------
       LEVEL
    -------------------------------------------------------------------- */

    if (filters.level) {

      query.level =
        filters.level;

    }


    /* --------------------------------------------------------------------
       DEPARTMENT
    -------------------------------------------------------------------- */

    if (filters.department) {

      query.department =
        filters.department;

    }


    /* --------------------------------------------------------------------
       STRUCTURAL SCOPE
    -------------------------------------------------------------------- */

    if (filters.scope) {

      query.scope =
        filters.scope;

    }


    /* --------------------------------------------------------------------
       REPORT VISIBILITY
    -------------------------------------------------------------------- */

    if (filters.reportVisibility) {

      query.reportVisibility =
        filters.reportVisibility;

    }


    /* --------------------------------------------------------------------
       POSITION
    -------------------------------------------------------------------- */

    if (filters.position) {

      query.position =
        normalizePosition(
          filters.position
        );

    }


    /* --------------------------------------------------------------------
       COUNTY
    -------------------------------------------------------------------- */

    if (filters.county) {

      query.county =
        normalizeCounty(
          filters.county
        );

    }


    /* --------------------------------------------------------------------
       CONSTITUENCY
    -------------------------------------------------------------------- */

    if (
      filters.constituency &&
      filters.county
    ) {

      query.constituency =
        normalizeConstituency(

          filters.county,

          filters.constituency

        );

    }


    /* --------------------------------------------------------------------
       WARD
    -------------------------------------------------------------------- */

    if (
      filters.ward &&
      filters.county &&
      filters.constituency
    ) {

      query.ward =
        normalizeWard(

          filters.county,

          filters.constituency,

          filters.ward

        );

    }


    /* --------------------------------------------------------------------
       MEMBER
    -------------------------------------------------------------------- */

    if (filters.member) {

      query.member =
        filters.member;

    }


    /* --------------------------------------------------------------------
       STATUS
    -------------------------------------------------------------------- */

    if (filters.status) {

      query.status =
        filters.status;

    }


    /* --------------------------------------------------------------------
       ACTIVE
    -------------------------------------------------------------------- */

    if (
      filters.active !== undefined
    ) {

      query.isActive =
        filters.active === true ||
        filters.active === "true";

    }


    return Leader.find(query)

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        level: 1,

        scope: 1,

        county: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     GET LEADER BY ID
  ====================================================================== */

  async getLeaderById(id) {

    this.validateObjectId(
      id,
      "leader ID"
    );


    const leader =
      await this.populateLeader(id);


    if (!leader) {

      throw new AppError(
        404,
        "Leader not found."
      );

    }


    return leader;

  }


  /* ======================================================================
     GET LEADER BY MEMBER
  ====================================================================== */

  async getLeaderByMember(
    memberId
  ) {

    this.validateObjectId(
      memberId,
      "member ID"
    );


    return Leader.findOne({

      member:
        memberId,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      );

  }


  /* ======================================================================
     GET LEADERSHIP MEMBERS
  ====================================================================== */

  async getLeadershipMembers(
    userId,
    query = {}
  ) {

    const {

      page = 1,

      limit = 20,

      search = "",

      membershipStatus,

      membershipType,

      sort = "-createdAt",

    } = query;


    const member =
      await Member.findOne({
        user: userId,
      });


    if (!member) {

      throw new AppError(
        404,
        "Member account not found."
      );

    }


    const leader =
      await Leader.findOne({

        member:
          member._id,

        isActive:
          true,

        status:
          LEADERSHIP_STATUS.ACTIVE,

      });


    if (!leader) {

      throw new AppError(
        403,
        "You are not an active leader."
      );

    }


    const filter = {

      accountActivated:
        true,

    };


    /*
     * Geographic access is controlled by
     * reportVisibility.
     */
    const jurisdiction =
      this.buildJurisdictionFilter(
        leader
      );


    Object.assign(
      filter,
      jurisdiction
    );


    /* --------------------------------------------------------------------
       ADDITIONAL FILTERS
    -------------------------------------------------------------------- */

    if (membershipStatus) {

      filter.membershipStatus =
        membershipStatus;

    }


    if (membershipType) {

      filter.membershipType =
        membershipType;

    }


    if (
      search &&
      search.trim()
    ) {

      const regex =
        new RegExp(
          search.trim(),
          "i"
        );


      filter.$or = [

        {
          memberNumber:
            regex,
        },

        {
          firstName:
            regex,
        },

        {
          middleName:
            regex,
        },

        {
          lastName:
            regex,
        },

        {
          phone:
            regex,
        },

      ];

    }


    /* --------------------------------------------------------------------
       SUMMARY
    -------------------------------------------------------------------- */

    const [

      totalMembers,

      activeMembers,

      maleMembers,

      femaleMembers,

    ] = await Promise.all([

      Member.countDocuments(
        filter
      ),

      Member.countDocuments({

        ...filter,

        membershipStatus:
          "active",

      }),

      Member.countDocuments({

        ...filter,

        gender:
          "male",

      }),

      Member.countDocuments({

        ...filter,

        gender:
          "female",

      }),

    ]);


    const startOfMonth =
      new Date();

    startOfMonth.setDate(1);

    startOfMonth.setHours(
      0,
      0,
      0,
      0
    );


    const newMembersThisMonth =
      await Member.countDocuments({

        ...filter,

        createdAt: {
          $gte:
            startOfMonth,
        },

      });


    const summary = {

      totalMembers,

      activeMembers,

      maleMembers,

      femaleMembers,

      newMembersThisMonth,

    };


    /* --------------------------------------------------------------------
       DISTRIBUTION
    -------------------------------------------------------------------- */

    let distribution = null;

    let groupField = null;

    let title = "";


    switch (
      leader.reportVisibility
    ) {

      case REPORT_VISIBILITY.REGIONAL:

        groupField =
          "$county";

        title =
          "County Distribution";

        break;


      case REPORT_VISIBILITY.COUNTY:

        groupField =
          "$constituency";

        title =
          "Constituency Distribution";

        break;


      case REPORT_VISIBILITY.CONSTITUENCY:

        groupField =
          "$ward";

        title =
          "Ward Distribution";

        break;


      case REPORT_VISIBILITY.WARD:

      case REPORT_VISIBILITY.PRIVATE:

        groupField =
          null;

        break;

    }


    if (groupField) {

      const graph =
        await Member.aggregate([

          {
            $match:
              filter,
          },

          {
            $group: {

              _id:
                groupField,

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

        data:
          graph.map(
            (item) => ({

              name:
                item._id ||
                "Unknown",

              members:
                item.members,

            })
          ),

      };

    }


    /* --------------------------------------------------------------------
       PAGINATION
    -------------------------------------------------------------------- */

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );


    const pageSize =
      Math.max(
        Number(limit) || 20,
        1
      );


    const skip =
      (currentPage - 1) *
      pageSize;


    const members =
      await Member.find(filter)

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


    const totalPages =
      Math.ceil(
        totalMembers /
        pageSize
      );


    const pagination = {

      page:
        currentPage,

      limit:
        pageSize,

      total:
        totalMembers,

      totalPages,

      hasNextPage:
        currentPage <
        totalPages,

      hasPreviousPage:
        currentPage > 1,

    };


    return {

      summary,

      distribution,

      members,

      pagination,

      leader: {

        position:
          leader.position,

        category:
          leader.category,

        level:
          leader.level,

        department:
          leader.department,

        scope:
          leader.scope,

        reportVisibility:
          leader.reportVisibility,

        county:
          leader.county,

        constituency:
          leader.constituency,

        ward:
          leader.ward,

      },

    };

  }


  /* ======================================================================
     GET ACTIVE LEADERS
  ====================================================================== */

  async getActiveLeaders() {

    return this.getLeaders({

      active:
        true,

    });

  }


  /* ======================================================================
     GET INACTIVE LEADERS
  ====================================================================== */

  async getInactiveLeaders() {

    return this.getLeaders({

      active:
        false,

    });

  }


  /* ======================================================================
     GET LEADERS BY CATEGORY
  ====================================================================== */

  async getLeadersByCategory(
    category
  ) {

    return this.getLeaders({

      category,

      active:
        true,

    });

  }


  /* ======================================================================
     GET LEADERS BY LEVEL
  ====================================================================== */

  async getLeadersByLevel(
    level
  ) {

    return this.getLeaders({

      level,

      active:
        true,

    });

  }


  /* ======================================================================
     GET LEADERS BY DEPARTMENT
  ====================================================================== */

  async getLeadersByDepartment(
    department
  ) {

    return this.getLeaders({

      department,

      active:
        true,

    });

  }


  /* ======================================================================
     GET LEADERS BY STRUCTURAL SCOPE
  ====================================================================== */

  async getLeadersByScope(
    scope
  ) {

    return this.getLeaders({

      scope,

      active:
        true,

    });

  }


  /* ======================================================================
     GET LEADERS BY REPORT VISIBILITY
  ====================================================================== */

  async getLeadersByReportVisibility(
    reportVisibility
  ) {

    return this.getLeaders({

      reportVisibility,

      active:
        true,

    });

  }


  /* ======================================================================
     GET COUNTY LEADERS
  ====================================================================== */

  async getCountyLeaders(
    county
  ) {

    county =
      normalizeCounty(county);


    return this.getLeaders({

      county,

      active:
        true,

    });

  }


  /* ======================================================================
     GET PUBLIC LEADERS
  ====================================================================== */

  async getPublicLeaders() {

    return Leader.find({

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        category: 1,

        level: 1,

        scope: 1,

        county: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     SEARCH LEADERS
  ====================================================================== */

  async searchLeaders(
    search = ""
  ) {

    const term =
      String(search).trim();


    if (!term) {

      return this.getLeaders();

    }


    const regex =
      new RegExp(
        term,
        "i"
      );


    return Leader.find({

      $or: [

        {
          position:
            regex,
        },

        {
          category:
            regex,
        },

        {
          level:
            regex,
        },

        {
          department:
            regex,
        },

        {
          scope:
            regex,
        },

        {
          reportVisibility:
            regex,
        },

        {
          county:
            regex,
        },

        {
          constituency:
            regex,
        },

        {
          ward:
            regex,
        },

        {
          "patron.fullName":
            regex,
        },

      ],

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        level: 1,

        scope: 1,

        county: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     UPDATE LEADER
  ====================================================================== */

  async updateLeader(
    id,
    updates,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    const currentPosition =
      leader.position;


    /*
     * Determine the resulting position.
     */
    const nextPosition =
      updates.position
        ? this.validateOffice(
            updates.position
          )
        : currentPosition;


    const nextOffice =
      this.getOffice(
        nextPosition
      );


    /*
     * Prevent Patron from accidentally
     * becoming a member-based office
     * without explicit position change.
     */
    if (
      leader.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE &&
      nextOffice.category !==
        LEADERSHIP_CATEGORIES.PATRONAGE
    ) {

      if (!updates.member) {

        throw new AppError(
          400,
          "A member is required when converting the Patron record to another leadership office."
        );

      }

    }


    /*
     * Member change.
     */
    if (
      updates.member &&
      updates.member.toString() !==
        leader.member?.toString()
    ) {

      await this.validateMemberAssignment(

        updates.member,

        leader._id

      );

    }


    /*
     * Non-Patron offices require
     * a member.
     */
    if (
      nextOffice.category !==
      LEADERSHIP_CATEGORIES.PATRONAGE
    ) {

      const resultingMember =
        updates.member !== undefined
          ? updates.member
          : leader.member;


      if (!resultingMember) {

        throw new AppError(
          400,
          "A member is required for this leadership office."
        );

      }

    }


    /*
     * Resolve resulting geography.
     */
    const location =
      this.validateLocation(

        nextPosition,

        updates.county !== undefined
          ? updates.county
          : leader.county,

        updates.constituency !== undefined
          ? updates.constituency
          : leader.constituency,

        updates.ward !== undefined
          ? updates.ward
          : leader.ward

      );


    /*
     * Prevent duplicate office assignment.
     */
    await this.validateOfficeAssignment(

      nextPosition,

      location,

      leader._id

    );


    /*
     * Always rebuild derived office fields.
     */
    const officeFields =
      this.buildOfficeFields(
        nextPosition
      );


    Object.assign(

      updates,

      officeFields,

      {

        county:
          location.county,

        constituency:
          location.constituency,

        ward:
          location.ward,

      }

    );


    /*
     * Patron records cannot retain
     * member or geographic data.
     */
    if (
      nextOffice.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE
    ) {

      updates.member =
        null;

      updates.county =
        null;

      updates.constituency =
        null;

      updates.ward =
        null;

    }


    /*
     * Prevent clients from changing
     * system-derived fields independently.
     */
    delete updates.category;
    delete updates.level;
    delete updates.department;
    delete updates.scope;
    delete updates.reportVisibility;
    delete updates.appointmentType;


    /*
     * Reapply trusted office fields.
     */
    Object.assign(
      updates,
      officeFields
    );


    /*
     * Reapply trusted geography.
     */
    Object.assign(

      updates,

      {

        county:
          location.county,

        constituency:
          location.constituency,

        ward:
          location.ward,

      }

    );


    Object.assign(
      leader,
      updates
    );


    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     ACTIVATE LEADER
  ====================================================================== */

  async activateLeader(
    id,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    await this.validateOfficeAssignment(

      leader.position,

      {

        county:
          leader.county,

        constituency:
          leader.constituency,

        ward:
          leader.ward,

      },

      leader._id

    );


    if (leader.member) {

      await this.validateMemberAssignment(

        leader.member,

        leader._id

      );

    }


    leader.isActive =
      true;

    leader.status =
      LEADERSHIP_STATUS.ACTIVE;

    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     DEACTIVATE LEADER
  ====================================================================== */

  async deactivateLeader(
    id,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    leader.isActive =
      false;

    leader.status =
      LEADERSHIP_STATUS.INACTIVE;

    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     COMPLETE LEADER TERM
  ====================================================================== */

  async completeLeaderTerm(
    id,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    leader.status =
      LEADERSHIP_STATUS.COMPLETED;

    leader.isActive =
      false;

    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     SUSPEND LEADER
  ====================================================================== */

  async suspendLeader(
    id,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    leader.status =
      LEADERSHIP_STATUS.SUSPENDED;

    leader.isActive =
      false;

    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     REINSTATE LEADER
  ====================================================================== */

  async reinstateLeader(
    id,
    userId
  ) {

    const leader =
      await this.findLeader(id);


    await this.validateOfficeAssignment(

      leader.position,

      {

        county:
          leader.county,

        constituency:
          leader.constituency,

        ward:
          leader.ward,

      },

      leader._id

    );


    if (leader.member) {

      await this.validateMemberAssignment(

        leader.member,

        leader._id

      );

    }


    leader.status =
      LEADERSHIP_STATUS.ACTIVE;

    leader.isActive =
      true;

    leader.updatedBy =
      userId;


    await leader.save();


    return this.populateLeader(
      leader._id
    );

  }


  /* ======================================================================
     DELETE LEADER
  ====================================================================== */

  async deleteLeader(id) {

    const leader =
      await this.findLeader(id);


    await leader.deleteOne();


    return true;

  }


  /* ======================================================================
     BULK ACTIVATE
  ====================================================================== */

  async activateMany(
    ids = [],
    userId
  ) {

    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {

      throw new AppError(
        400,
        "No leadership records were provided."
      );

    }


    const validIds =
      ids.filter(
        (id) =>
          mongoose.isValidObjectId(id)
      );


    if (
      validIds.length !==
      ids.length
    ) {

      throw new AppError(
        400,
        "One or more leadership IDs are invalid."
      );

    }


    await Leader.updateMany(

      {

        _id: {
          $in:
            validIds,
        },

      },

      {

        $set: {

          isActive:
            true,

          status:
            LEADERSHIP_STATUS.ACTIVE,

          updatedBy:
            userId,

        },

      }

    );


    return true;

  }


  /* ======================================================================
     BULK DEACTIVATE
  ====================================================================== */

  async deactivateMany(
    ids = [],
    userId
  ) {

    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {

      throw new AppError(
        400,
        "No leadership records were provided."
      );

    }


    const validIds =
      ids.filter(
        (id) =>
          mongoose.isValidObjectId(id)
      );


    if (
      validIds.length !==
      ids.length
    ) {

      throw new AppError(
        400,
        "One or more leadership IDs are invalid."
      );

    }


    await Leader.updateMany(

      {

        _id: {
          $in:
            validIds,
        },

      },

      {

        $set: {

          isActive:
            false,

          status:
            LEADERSHIP_STATUS.INACTIVE,

          updatedBy:
            userId,

        },

      }

    );


    return true;

  }


  /* ======================================================================
     LEADERSHIP STATISTICS
  ====================================================================== */

  async getStatistics() {

    const [

      total,

      active,

      inactive,

      completed,

      suspended,

      regionalCabinet,

      regionalYouthAssembly,

      councilOfGovernors,

      countyCabinet,

      countyYouthAssembly,

      executive,

      legislative,

      secretariat,

      patronage,

    ] = await Promise.all([

      Leader.countDocuments(),

      Leader.countDocuments({
        isActive: true,
      }),

      Leader.countDocuments({
        isActive: false,
      }),

      Leader.countDocuments({
        status:
          LEADERSHIP_STATUS.COMPLETED,
      }),

      Leader.countDocuments({
        status:
          LEADERSHIP_STATUS.SUSPENDED,
      }),

      Leader.countDocuments({
        level:
          LEADERSHIP_LEVELS.REGIONAL_CABINET,
      }),

      Leader.countDocuments({
        level:
          LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
      }),

      Leader.countDocuments({
        level:
          LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
      }),

      Leader.countDocuments({
        level:
          LEADERSHIP_LEVELS.COUNTY_CABINET,
      }),

      Leader.countDocuments({
        level:
          LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
      }),

      Leader.countDocuments({
        category:
          LEADERSHIP_CATEGORIES.EXECUTIVE,
      }),

      Leader.countDocuments({
        category:
          LEADERSHIP_CATEGORIES.LEGISLATIVE,
      }),

      Leader.countDocuments({
        category:
          LEADERSHIP_CATEGORIES.SECRETARIAT,
      }),

      Leader.countDocuments({
        category:
          LEADERSHIP_CATEGORIES.PATRONAGE,
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

        regionalCabinet,

        regionalYouthAssembly,

        councilOfGovernors,

        countyCabinet,

        countyYouthAssembly,

      },


      categories: {

        executive,

        legislative,

        secretariat,

        patronage,

      },

    };

  }


  /* ======================================================================
     LEADERS BY COUNTY
  ====================================================================== */

  async getCountyStatistics() {

    return Leader.aggregate([

      {
        $match: {

          isActive:
            true,

          county: {
            $ne:
              null,
          },

        },

      },

      {
        $group: {

          _id:
            "$county",

          total: {
            $sum:
              1,
          },

        },

      },

      {
        $sort: {

          _id:
            1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY POSITION
  ====================================================================== */

  async getPositionStatistics() {

    return Leader.aggregate([

      {
        $match: {

          isActive:
            true,

        },

      },

      {
        $group: {

          _id:
            "$position",

          total: {
            $sum:
              1,
          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY LEVEL
  ====================================================================== */

  async getLevelStatistics() {

    return Leader.aggregate([

      {
        $group: {

          _id:
            "$level",

          total: {
            $sum:
              1,
          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY CATEGORY
  ====================================================================== */

  async getCategoryStatistics() {

    return Leader.aggregate([

      {
        $group: {

          _id:
            "$category",

          total: {
            $sum:
              1,
          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY SCOPE
  ====================================================================== */

  async getScopeStatistics() {

    return Leader.aggregate([

      {
        $group: {

          _id:
            "$scope",

          total: {
            $sum:
              1,

          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY REPORT VISIBILITY
  ====================================================================== */

  async getReportVisibilityStatistics() {

    return Leader.aggregate([

      {
        $group: {

          _id:
            "$reportVisibility",

          total: {
            $sum:
              1,

          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     LEADERS BY GENDER
  ====================================================================== */

  async getGenderStatistics() {

    return Leader.aggregate([

      {
        $match: {

          isActive:
            true,

          member: {
            $ne:
              null,
          },

        },

      },

      {
        $lookup: {

          from:
            "members",

          localField:
            "member",

          foreignField:
            "_id",

          as:
            "member",

        },

      },

      {
        $unwind:
          "$member",

      },

      {
        $group: {

          _id:
            "$member.gender",

          total: {
            $sum:
              1,
          },

        },

      },

      {
        $sort: {

          total:
            -1,

        },

      },

    ]);

  }


  /* ======================================================================
     COMPLETE DASHBOARD
  ====================================================================== */

  async getDashboardStatistics() {

    const [

      statistics,

      counties,

      positions,

      levels,

      categories,

      scopes,

      reportVisibility,

      gender,

    ] = await Promise.all([

      this.getStatistics(),

      this.getCountyStatistics(),

      this.getPositionStatistics(),

      this.getLevelStatistics(),

      this.getCategoryStatistics(),

      this.getScopeStatistics(),

      this.getReportVisibilityStatistics(),

      this.getGenderStatistics(),

    ]);


    return {

      statistics,

      charts: {

        counties,

        positions,

        levels,

        categories,

        scopes,

        reportVisibility,

        gender,

      },

    };

  }


  /* ======================================================================
     REGIONAL CABINET
  ====================================================================== */

  async getRegionalCabinet() {

    return this.getLeaders({

      level:
        LEADERSHIP_LEVELS.REGIONAL_CABINET,

      active:
        true,

    });

  }


  /* ======================================================================
     REGIONAL YOUTH ASSEMBLY
  ====================================================================== */

  async getRegionalYouthAssembly() {

    return this.getLeaders({

      level:
        LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

      active:
        true,

    });

  }


  /* ======================================================================
     COUNCIL OF GOVERNORS
  ====================================================================== */

  async getCouncilOfGovernors() {

    return this.getLeaders({

      level:
        LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,

      active:
        true,

    });

  }


  /* ======================================================================
     COUNTY CABINET
  ====================================================================== */

  async getCountyCabinet(
    county = null
  ) {

    const filters = {

      level:
        LEADERSHIP_LEVELS.COUNTY_CABINET,

      active:
        true,

    };


    if (county) {

      filters.county =
        normalizeCounty(
          county
        );

    }


    return this.getLeaders(
      filters
    );

  }


  /* ======================================================================
     COUNTY YOUTH ASSEMBLY
  ====================================================================== */

  async getCountyYouthAssembly(
    county = null
  ) {

    const filters = {

      level:
        LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

      active:
        true,

    };


    if (county) {

      filters.county =
        normalizeCounty(
          county
        );

    }


    return this.getLeaders(
      filters
    );

  }


  /* ======================================================================
     REGIONAL EXECUTIVE — LEGACY COMPATIBILITY
  ====================================================================== */

  async getRegionalExecutive() {

    return this.getRegionalCabinet();

  }


  /* ======================================================================
     YOUTH ASSEMBLY — LEGACY COMPATIBILITY
  ====================================================================== */

  async getYouthAssembly() {

    return this.getRegionalYouthAssembly();

  }


  /* ======================================================================
     COUNTY LEADERSHIP — LEGACY COMPATIBILITY
  ====================================================================== */

  async getCountyLeadership(
    county = null
  ) {

    return this.getCountyCabinet(
      county
    );

  }


  /* ======================================================================
     LEADERS BY COUNTY
  ====================================================================== */

  async getLeadershipByCounty(
    county
  ) {

    county =
      normalizeCounty(
        county
      );


    return Leader.find({

      county,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        level: 1,

        scope: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     LEADERS BY CONSTITUENCY
  ====================================================================== */

  async getLeadershipByConstituency(
    county,
    constituency
  ) {

    county =
      normalizeCounty(
        county
      );


    constituency =
      normalizeConstituency(
        county,
        constituency
      );


    return Leader.find({

      county,

      constituency,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        level: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     LEADERS BY WARD
  ====================================================================== */

  async getLeadershipByWard(
    county,
    constituency,
    ward
  ) {

    county =
      normalizeCounty(
        county
      );


    constituency =
      normalizeConstituency(
        county,
        constituency
      );


    ward =
      normalizeWard(
        county,
        constituency,
        ward
      );


    return Leader.find({

      county,

      constituency,

      ward,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        level: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     LEADERS BY POSITION
  ====================================================================== */

  async getLeadersByPosition(
    position
  ) {

    position =
      normalizePosition(
        position
      );


    if (!isValidOffice(position)) {

      throw new AppError(
        400,
        "Invalid leadership office."
      );

    }


    return Leader.find({

      position,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        displayOrder:
          1,

        county:
          1,

        constituency:
          1,

        ward:
          1,

      });

  }


  /* ======================================================================
     LEADERSHIP DIRECTORY
  ====================================================================== */

  async getLeadershipDirectory() {

    return Leader.find({

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    })

      .populate(
        "member",
        MEMBER_POPULATE
      )

      .sort({

        category: 1,

        level: 1,

        scope: 1,

        county: 1,

        displayOrder: 1,

        position: 1,

      });

  }


  /* ======================================================================
     PATRON
  ====================================================================== */

  async getPatron() {

    return Leader.findOne({

      position:
        LEADERSHIP_OFFICES.PATRON,

      category:
        LEADERSHIP_CATEGORIES.PATRONAGE,

      isActive:
        true,

      status:
        LEADERSHIP_STATUS.ACTIVE,

    });

  }


  /* ======================================================================
     VACANT POSITIONS
  ====================================================================== */

  async getVacantPositions() {

    const occupied =
      await Leader.find({

        isActive:
          true,

        status:
          LEADERSHIP_STATUS.ACTIVE,

      })

        .select(
          "position reportVisibility county constituency ward"
        )

        .lean();


    const vacant = [];


    for (
      const office
      of LEADERSHIP_OFFICE_VALUES
    ) {

      /*
       * Portfolio offices may have
       * multiple active holders.
       */
      if (
        this.officeAllowsMultiple(
          office
        )
      ) {

        continue;

      }


      const configuration =
        getOfficeConfiguration(
          office
        );


      if (!configuration) {
        continue;
      }


      /*
       * Patron is not treated as an
       * ordinary vacant office.
       */
      if (
        office ===
        LEADERSHIP_OFFICES.PATRON
      ) {

        const exists =
          occupied.some(
            (leader) =>
              leader.position ===
              office
          );


        if (!exists) {

          vacant.push({

            position:
              office,

            ...configuration,

          });

        }


        continue;

      }


      /*
       * Regional office.
       */
      if (
        configuration.reportVisibility ===
        REPORT_VISIBILITY.REGIONAL
      ) {

        const exists =
          occupied.some(
            (leader) =>
              leader.position ===
              office
          );


        if (!exists) {

          vacant.push({

            position:
              office,

            ...configuration,

          });

        }


        continue;

      }


      /*
       * County, constituency and ward
       * offices require jurisdiction-specific
       * vacancy calculations.
       *
       * We therefore return the office definition
       * only when there are currently no holders
       * anywhere.
       */
      if (

        configuration.reportVisibility ===
          REPORT_VISIBILITY.COUNTY ||

        configuration.reportVisibility ===
          REPORT_VISIBILITY.CONSTITUENCY ||

        configuration.reportVisibility ===
          REPORT_VISIBILITY.WARD

      ) {

        const occupiedCount =
          occupied.filter(
            (leader) =>
              leader.position ===
              office
          ).length;


        if (occupiedCount === 0) {

          vacant.push({

            position:
              office,

            ...configuration,

          });

        }

      }

    }


    return vacant;

  }


  /* ======================================================================
     VERIFY LEADERSHIP CARD
  ====================================================================== */

  async verifyLeadershipCard(
    id
  ) {

    this.validateObjectId(
      id,
      "leader ID"
    );


    const leader =
      await Leader.findById(id)

        .populate(
          "member",
          MEMBER_POPULATE
        );


    if (!leader) {

      throw new AppError(
        404,
        "Leadership record not found."
      );

    }


    return {

      valid:

        leader.isActive === true &&

        leader.status ===
          LEADERSHIP_STATUS.ACTIVE,

      leader,

    };

  }


  /* ======================================================================
     LEADERSHIP HIERARCHY
  ====================================================================== */

  async getLeadershipHierarchy() {

    const [

      patron,

      regionalCabinet,

      regionalAssembly,

      governors,

      countyCabinet,

      countyAssemblies,

    ] = await Promise.all([

      this.getPatron(),

      this.getRegionalCabinet(),

      this.getRegionalYouthAssembly(),

      this.getCouncilOfGovernors(),

      this.getCountyCabinet(),

      this.getCountyYouthAssembly(),

    ]);


    return {

      patronage:
        patron
          ? [patron]
          : [],

      regionalCabinet,

      regionalYouthAssembly:
        regionalAssembly,

      councilOfGovernors:
        governors,

      countyCabinet,

      countyYouthAssembly:
        countyAssemblies,

    };

  }

}


/* ========================================================================
   EXPORT SERVICE
======================================================================== */

export default new LeaderService();
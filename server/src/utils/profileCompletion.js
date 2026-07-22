export function calculateProfileCompletion(member) {

    const fields = [

        member.firstName,
        member.lastName,
        member.gender,
        member.dateOfBirth,
        member.nationalId,
        member.phone,

        member.county,
        member.constituency,
        member.ward,

        member.profilePhoto,

        member.occupation,

    ];

    let completed = 0;

    fields.forEach(field => {

        if (
            field !== undefined &&
            field !== null &&
            field !== ""
        ) {
            completed++;
        }

    });

    return Math.round(
        (completed / fields.length) * 100
    );

}
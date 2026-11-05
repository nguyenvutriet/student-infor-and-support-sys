export const ROLES = {
    ADMIN: "admin",
    STAFF: "staff",
    STUDENT: "student",
};

export const ROLE_HOME = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.STAFF]: "/staff/forum",
    [ROLES.STUDENT]: "/student",
};

const ROLE_PRIORITY = [ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT];

export const normalizeRole = (rawRole) => {
    const list = Array.isArray(rawRole) ? rawRole : [rawRole];
    const normalized = list
        .filter((r) => typeof r === "string")
        .map((r) => r.trim().replace(/^ROLE_/i, "").toLowerCase());
    return ROLE_PRIORITY.find((r) => normalized.includes(r)) ?? null;
};

export const getUserRole = (user) => normalizeRole(user?.role ?? user?.roles);

export const getHomePath = (user) => {
    const role = getUserRole(user);
    return role ? ROLE_HOME[role] : null;
};

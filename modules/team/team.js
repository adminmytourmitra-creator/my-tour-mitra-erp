/* =========================================================
   MY TOUR MITRA ERP
   TEAM & ACCESS MANAGEMENT MODULE
   File: modules/team/team.js

   Hierarchy:
   ADMIN
      ↓
   MANAGER
      ↓
   EMPLOYEE / STAFF / OTHER

   Rules:
   - Admin can create/request Manager
   - Manager requires Admin approval
   - Manager can request Employees under them
   - Employee requires Manager/Admin approval
   - Users can only manage users inside their hierarchy
   - Deactivated users lose ERP access
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
       ===================================================== */

    let teamMembers = [];

    let currentUser = null;

    let editingMemberId = null;

    let selectedApprovalId = null;

    let selectedDeactivateId = null;


    /* =====================================================
       ROLE HIERARCHY
       ===================================================== */

    const ROLE_LEVELS = {

        Admin: 100,

        Manager: 70,

        Employee: 40,

        Staff: 30,

        Other: 20

    };


    /* =====================================================
       DOM HELPER
       ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    function getCurrentUser() {

        if (
            window.currentUser
        ) {

            return window.currentUser;

        }


        if (
            window.currentUserData
        ) {

            return window.currentUserData;

        }


        if (
            window.authUser
        ) {

            return window.authUser;

        }


        return null;

    }


    /* =====================================================
       CURRENT ROLE
       ===================================================== */

    function getCurrentRole() {

        currentUser =
            getCurrentUser();


        return (
            currentUser?.role ||
            currentUser?.userRole ||
            "Employee"
        );

    }


    /* =====================================================
       ROLE LEVEL
       ===================================================== */

    function getRoleLevel(role) {

        return (
            ROLE_LEVELS[role] ||
            0
        );

    }


    /* =====================================================
       NORMALIZE DATE
       ===================================================== */

    function normalizeDate(value) {

        if (!value) {

            return null;

        }


        if (
            typeof value.toDate ===
            "function"
        ) {

            return value.toDate();

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        return date;

    }


    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatDate(value) {

        const date =
            normalizeDate(value);


        if (!date) {

            return "-";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       GET FULL NAME
       ===================================================== */

    function getFullName(member) {

        if (
            member.name
        ) {

            return member.name;

        }


        const first =
            member.firstName ||
            "";

        const last =
            member.lastName ||
            "";


        return (
            `${first} ${last}`
                .trim() ||
            "Unnamed User"
        );

    }


    /* =====================================================
       GET MEMBER ID
       ===================================================== */

    function getMemberId(member) {

        return (
            member.id ||
            member.uid ||
            member.userId ||
            ""
        );

    }


    /* =====================================================
       CHECK ADMIN
       ===================================================== */

    function isAdmin() {

        return (
            getCurrentRole() ===
            "Admin"
        );

    }


    /* =====================================================
       CHECK MANAGER
       ===================================================== */

    function isManager() {

        const role =
            getCurrentRole();

        return (
            role === "Manager" ||
            role === "Admin"
        );

    }


    /* =====================================================
       WHO CAN CREATE WHICH ROLE
       ===================================================== */

    function canCreateRole(
        targetRole
    ) {

        const currentRole =
            getCurrentRole();


        if (
            currentRole ===
            "Admin"
        ) {

            return (
                targetRole === "Manager" ||
                targetRole === "Employee" ||
                targetRole === "Staff" ||
                targetRole === "Other"
            );

        }


        if (
            currentRole ===
            "Manager"
        ) {

            return (
                targetRole === "Employee" ||
                targetRole === "Staff" ||
                targetRole === "Other"
            );

        }


        return false;

    }


    /* =====================================================
       APPROVAL REQUIRED
       ===================================================== */

    function approvalRequired(
        targetRole
    ) {

        if (
            targetRole ===
            "Manager"
        ) {

            return true;

        }


        if (
            targetRole ===
            "Employee" ||
            targetRole === "Staff" ||
            targetRole === "Other"
        ) {

            return true;

        }


        return true;

    }


    /* =====================================================
       GET APPROVER ROLE
       ===================================================== */

    function getRequiredApproverRole(
        targetRole
    ) {

        if (
            targetRole ===
            "Manager"
        ) {

            return "Admin";

        }


        return "Manager / Admin";

    }


    /* =====================================================
       CHECK REPORTING RELATIONSHIP
       ===================================================== */

    function isUnderCurrentUser(
        member
    ) {

        currentUser =
            getCurrentUser();


        if (
            !currentUser ||
            isAdmin()
        ) {

            return true;

        }


        const currentId =
            currentUser.uid ||
            currentUser.id ||
            currentUser.userId;


        if (
            !currentId
        ) {

            return false;

        }


        if (
            member.reportsToId ===
            currentId
        ) {

            return true;

        }


        if (
            member.parentId ===
            currentId
        ) {

            return true;

        }


        return false;

    }


    /* =====================================================
       CAN MANAGE MEMBER
       ===================================================== */

    function canManageMember(
        member
    ) {

        if (!member) {

            return false;

        }


        if (isAdmin()) {

            return true;

        }


        if (
            getCurrentRole() ===
            "Manager"
        ) {

            return isUnderCurrentUser(
                member
            );

        }


        return false;

    }


    /* =====================================================
       SHOW / HIDE FORM
       ===================================================== */

    function showTeamForm() {

        const section =
            $("teamFormSection");


        if (!section) {

            return;

        }


        section.hidden = false;

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    function hideTeamForm() {

        const section =
            $("teamFormSection");


        if (!section) {

            return;

        }


        section.hidden = true;

        resetTeamForm();

    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetTeamForm() {

        const form =
            $("teamMemberForm");


        if (form) {

            form.reset();

        }


        editingMemberId =
            null;


        if (
            $("teamMemberId")
        ) {

            $("teamMemberId").value =
                "";

        }


        setDefaultPermissions();

        updateRoleRules();

    }


    /* =====================================================
       ROLE DROPDOWN
       ===================================================== */

    function setupRoleDropdown() {

        const roleSelect =
            $("teamRole");


        if (!roleSelect) {

            return;

        }


        const options =
            roleSelect.querySelectorAll(
                "option"
            );


        options.forEach(
            option => {

                const role =
                    option.value;


                if (!role) {

                    return;

                }


                if (
                    role ===
                    "Admin"
                ) {

                    option.disabled =
                        !isAdmin();

                    return;

                }


                option.disabled =
                    !canCreateRole(
                        role
                    );

            }
        );

    }


    /* =====================================================
       REPORTING MANAGER DROPDOWN
       ===================================================== */

    function populateReportsTo() {

        const select =
            $("teamReportsTo");


        if (!select) {

            return;

        }


        const selected =
            select.value;


        select.innerHTML = `

            <option value="">
                Select Reporting Manager
            </option>

        `;


        const currentRole =
            getCurrentRole();


        let available = [];


        if (
            currentRole ===
            "Admin"
        ) {

            available =
                teamMembers.filter(
                    member => {

                        const role =
                            member.role;

                        return (
                            role ===
                            "Admin" ||
                            role ===
                            "Manager"
                        );

                    }
                );

        } else if (
            currentRole ===
            "Manager"
        ) {

            currentUser =
                getCurrentUser();


            const currentId =
                currentUser?.uid ||
                currentUser?.id ||
                currentUser?.userId;


            if (currentId) {

                const me =
                    teamMembers.find(
                        member =>
                            getMemberId(
                                member
                            ) ===
                            currentId
                    );


                if (me) {

                    available.push(
                        me
                    );

                }

            }

        }


        available.forEach(
            member => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getMemberId(
                        member
                    );


                option.textContent =
                    `${getFullName(
                        member
                    )} — ${
                        member.role ||
                        ""
                    }`;


                select.appendChild(
                    option
                );

            }
        );


        if (selected) {

            select.value =
                selected;

        }

    }


    /* =====================================================
       MANAGER FILTER
       ===================================================== */

    function populateManagerFilter() {

        const select =
            $("teamManagerFilter");


        if (!select) {

            return;

        }


        select.innerHTML = `

            <option value="">
                All Managers
            </option>

        `;


        teamMembers

            .filter(
                member =>
                    member.role ===
                    "Manager"
            )

            .forEach(
                member => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        getMemberId(
                            member
                        );


                    option.textContent =
                        getFullName(
                            member
                        );


                    select.appendChild(
                        option
                    );

                }
            );

    }


    /* =====================================================
       DEFAULT PERMISSIONS
       ===================================================== */

    function setDefaultPermissions() {

        const permissions = [

            "dashboard",

            "customers",

            "enquiries",

            "followups",

            "packages",

            "hotels",

            "cabs",

            "agencies",

            "quotations",

            "bookings",

            "invoices",

            "vouchers",

            "payments",

            "expenses",

            "profit-loss",

            "team",

            "settings"

        ];


        permissions.forEach(
            permission => {

                const checkbox =
                    document.querySelector(
                        `[data-permission="${permission}"]`
                    );


                if (!checkbox) {

                    return;

                }


                checkbox.checked =
                    false;

            }
        );


        const role =
            $("teamRole")?.value;


        if (
            role ===
            "Admin"
        ) {

            permissions.forEach(
                permission => {

                    const checkbox =
                        document.querySelector(
                            `[data-permission="${permission}"]`
                        );


                    if (checkbox) {

                        checkbox.checked =
                            true;

                    }

                }
            );

            return;

        }


        const standardPermissions = [

            "dashboard",

            "customers",

            "enquiries",

            "followups",

            "packages",

            "quotations",

            "bookings",

            "vouchers"

        ];


        standardPermissions.forEach(
            permission => {

                const checkbox =
                    document.querySelector(
                        `[data-permission="${permission}"]`
                    );


                if (checkbox) {

                    checkbox.checked =
                        true;

                }

            }
        );

    }


    /* =====================================================
       ROLE RULES
       ===================================================== */

    function updateRoleRules() {

        const role =
            $("teamRole")?.value;


        const warning =
            $("teamHierarchyWarning");


        const ruleText =
            $("teamApprovalRuleText");


        if (
            warning
        ) {

            warning.hidden =
                true;

        }


        if (
            ruleText
        ) {

            if (
                role ===
                "Manager"
            ) {

                ruleText.textContent =
                    "Manager accounts require Admin approval before the account can become active.";

            } else {

                ruleText.textContent =
                    "Employee, Staff and Other accounts require approval from the assigned Manager or Admin.";

            }

        }


        populateReportsTo();

        updatePermissionAvailability();

    }


    /* =====================================================
       PERMISSION AVAILABILITY
       ===================================================== */

    function updatePermissionAvailability() {

        const role =
            $("teamRole")?.value;


        const checkboxes =
            document.querySelectorAll(
                "[data-permission]"
            );


        checkboxes.forEach(
            checkbox => {

                checkbox.disabled =
                    false;

            }
        );


        if (
            role ===
            "Admin"
        ) {

            checkboxes.forEach(
                checkbox => {

                    checkbox.checked =
                        true;

                    checkbox.disabled =
                        true;

                }
            );

            return;

        }


        if (
            role ===
            "Manager"
        ) {

            const restricted = [

                "settings",

                "team"

            ];


            checkboxes.forEach(
                checkbox => {

                    if (
                        restricted.includes(
                            checkbox.dataset.permission
                        )
                    ) {

                        checkbox.checked =
                            false;

                    }

                }
            );

        }

    }


    /* =====================================================
       GET SELECTED PERMISSIONS
       ===================================================== */

    function getSelectedPermissions() {

        const permissions = [];


        document
            .querySelectorAll(
                "[data-permission]:checked"
            )
            .forEach(
                checkbox => {

                    permissions.push(
                        checkbox.dataset.permission
                    );

                }
            );


        return permissions;

    }


    /* =====================================================
       COLLECT FORM DATA
       ===================================================== */

    function collectFormData() {

        currentUser =
            getCurrentUser();


        const role =
            $("teamRole")?.value;


        const firstName =
            $("teamFirstName")?.value
            .trim();


        const lastName =
            $("teamLastName")?.value
            .trim();


        const mobile =
            $("teamMobile")?.value
            .trim();


        const email =
            $("teamEmail")?.value
            .trim();


        const reportsToId =
            $("teamReportsTo")?.value;


        const reportsToMember =
            teamMembers.find(
                member =>
                    getMemberId(
                        member
                    ) ===
                    reportsToId
            );


        return {

            id:
                editingMemberId ||
                null,

            firstName,

            lastName,

            name:
                `${firstName} ${lastName}`
                    .trim(),

            mobile,

            email,

            role,

            department:
                $("teamDepartment")
                    ?.value
                    .trim() ||
                "",

            designation:
                $("teamDesignation")
                    ?.value
                    .trim() ||
                "",

            reportsToId,

            reportsToName:
                reportsToMember
                    ? getFullName(
                        reportsToMember
                    )
                    : "",

            reportsToRole:
                reportsToMember
                    ?.role ||
                "",

            accountStatus:
                editingMemberId
                    ? (
                        $("teamAccountStatus")
                            ?.value ||
                        "Pending"
                    )
                    : "Pending",

            accessLevel:
                $("teamAccessLevel")
                    ?.value ||
                "Restricted",

            permissions:
                getSelectedPermissions(),

            requestedById:
                currentUser?.uid ||
                currentUser?.id ||
                currentUser?.userId ||
                "",

            requestedByName:
                currentUser
                    ? getFullName(
                        currentUser
                    )
                    : "",

            approvalStatus:
                "Pending",

            approvedById:
                "",

            approvedByName:
                "",

            approvalDate:
                null,

            notes:
                $("teamNotes")
                    ?.value
                    .trim() ||
                "",

            updatedAt:
                new Date(),

            createdAt:
                new Date()

        };

    }


    /* =====================================================
       VALIDATE FORM
       ===================================================== */

    function validateForm(
        data
    ) {

        if (!data.firstName) {

            alert(
                "Please enter first name."
            );

            return false;

        }


        if (!data.email) {

            alert(
                "Please enter email."
            );

            return false;

        }


        if (!data.role) {

            alert(
                "Please select a role."
            );

            return false;

        }


        if (
            !canCreateRole(
                data.role
            ) &&
            !editingMemberId
        ) {

            alert(
                "You do not have permission to create this role."
            );

            return false;

        }


        if (
            data.role !==
            "Admin" &&
            !data.reportsToId
        ) {

            alert(
                "Please select who this user reports to."
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       SAVE MEMBER
       ===================================================== */

    async function saveMember(
        data
    ) {

        /*
         * Prefer existing ERP data layer if available.
         */

        if (
            typeof window.saveTeamMember ===
            "function"
        ) {

            return window.saveTeamMember(
                data
            );

        }


        /*
         * Firebase fallback.
         */

        if (
            window.firebase &&
            window.db
        ) {

            try {

                const firestore =
                    window.firebase.firestore();


                if (
                    editingMemberId
                ) {

                    await firestore
                        .collection(
                            "teamMembers"
                        )
                        .doc(
                            editingMemberId
                        )
                        .update(
                            data
                        );

                } else {

                    await firestore
                        .collection(
                            "teamMembers"
                        )
                        .add(
                            data
                        );

                }


                return true;

            } catch (error) {

                console.error(
                    "Team save error:",
                    error
                );

                alert(
                    "Unable to save team member."
                );

                return false;

            }

        }


        /*
         * Local fallback only for UI testing.
         */

        if (
            editingMemberId
        ) {

            const index =
                teamMembers.findIndex(
                    member =>
                        getMemberId(
                            member
                        ) ===
                        editingMemberId
                );


            if (
                index !== -1
            ) {

                teamMembers[index] = {

                    ...teamMembers[index],

                    ...data,

                    id:
                        editingMemberId,

                    updatedAt:
                        new Date()

                };

            }

        } else {

            teamMembers.push({

                ...data,

                id:
                    `TEMP-${Date.now()}`,

                createdAt:
                    new Date()

            });

        }


        return true;

    }


    /* =====================================================
       LOAD TEAM MEMBERS
       ===================================================== */

    async function loadTeamMembers() {

        showLoading(
            true
        );


        try {

            if (
                typeof window.loadTeamMembersData ===
                "function"
            ) {

                const result =
                    await window.loadTeamMembersData();


                teamMembers =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            } else if (
                window.firebase &&
                window.db
            ) {

                const snapshot =
                    await window.db
                        .collection(
                            "teamMembers"
                        )
                        .get();


                teamMembers =
                    snapshot.docs.map(
                        doc => ({

                            id:
                                doc.id,

                            ...doc.data()

                        })
                    );

            }


            renderTeam();

        } catch (error) {

            console.error(
                "Unable to load team members:",
                error
            );


            teamMembers =
                [];


            renderTeam();

        } finally {

            showLoading(
                false
            );

        }

    }


    /* =====================================================
       FILTER MEMBERS
       ===================================================== */

    function getFilteredMembers() {

        const search =
            (
                $("teamSearch")
                    ?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const role =
            $("teamRoleFilter")
                ?.value ||
            "";


        const status =
            $("teamStatusFilter")
                ?.value ||
            "";


        const manager =
            $("teamManagerFilter")
                ?.value ||
            "";


        return teamMembers.filter(
            member => {

                if (
                    search
                ) {

                    const text =
                        [

                            getFullName(
                                member
                            ),

                            member.email,

                            member.mobile,

                            member.department,

                            member.designation

                        ]
                            .join(" ")
                            .toLowerCase();


                    if (
                        !text.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                if (
                    role &&
                    member.role !==
                    role
                ) {

                    return false;

                }


                if (
                    status &&
                    (
                        member.accountStatus ||
                        "Pending"
                    ) !==
                    status
                ) {

                    return false;

                }


                if (
                    manager &&
                    member.reportsToId !==
                    manager
                ) {

                    return false;

                }


                return true;

            }
        );

    }


    /* =====================================================
       RENDER TEAM
       ===================================================== */

    function renderTeam() {

        const tbody =
            $("teamTableBody");


        if (!tbody) {

            return;

        }


        const members =
            getFilteredMembers();


        if (
            !members.length
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="empty-state"
                    >
                        No team members found.
                    </td>

                </tr>

            `;

            updateSummary();

            renderApprovals();

            return;

        }


        tbody.innerHTML =
            members
                .map(
                    member =>
                        renderMemberRow(
                            member
                        )
                )
                .join("");


        updateSummary();

        renderApprovals();

        populateManagerFilter();

        populateReportsTo();

    }


    /* =====================================================
       MEMBER ROW
       ===================================================== */

    function renderMemberRow(
        member
    ) {

        const id =
            getMemberId(
                member
            );


        const status =
            member.accountStatus ||
            "Pending";


        const approval =
            member.approvalStatus ||
            "Pending";


        const canManage =
            canManageMember(
                member
            );


        const reportName =
            member.reportsToName ||
            getReportsToName(
                member.reportsToId
            );


        return `

            <tr>

                <td>

                    <div
                        class="team-member-cell"
                    >

                        <div
                            class="team-avatar"
                        >
                            ${escapeHTML(
                                getFullName(
                                    member
                                )
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    getFullName(
                                        member
                                    )
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    member.email ||
                                    ""
                                )}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="
                            role-badge
                            role-${String(
                                member.role ||
                                ""
                            ).toLowerCase()}
                        "
                    >
                        ${escapeHTML(
                            member.role ||
                            "-"
                        )}
                    </span>

                </td>


                <td>
                    ${escapeHTML(
                        member.department ||
                        "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        reportName ||
                        "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        member.accessLevel ||
                        "Restricted"
                    )}
                </td>


                <td>

                    <span
                        class="
                            status-badge
                            status-${String(
                                status
                            ).toLowerCase()}
                        "
                    >
                        ${escapeHTML(
                            status
                        )}
                    </span>

                </td>


                <td>

                    <span
                        class="
                            approval-badge
                            approval-${String(
                                approval
                            ).toLowerCase()}
                        "
                    >
                        ${escapeHTML(
                            approval
                        )}
                    </span>

                </td>


                <td>

                    <div
                        class="table-actions"
                    >

                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-action="view"
                            data-id="${escapeHTML(
                                id
                            )}"
                        >
                            View
                        </button>


                        ${
                            canManage
                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-secondary"
                                        data-action="edit"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                  `
                                : ""
                        }


                        ${
                            approval ===
                            "Pending" &&
                            canApprove(
                                member
                            )
                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary"
                                        data-action="approve"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Approve
                                    </button>

                                  `
                                : ""
                        }


                        ${
                            status ===
                                "Active" &&
                            canManage
                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-danger"
                                        data-action="deactivate"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Disable Access
                                    </button>

                                  `
                                : ""
                        }


                        ${
                            status ===
                                "Inactive" &&
                            canManage
                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary"
                                        data-action="reactivate"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Reactivate
                                    </button>

                                  `
                                : ""
                        }

                    </div>

                </td>

            </tr>

        `;

    }


    /* =====================================================
       REPORTING NAME
       ===================================================== */

    function getReportsToName(
        reportsToId
    ) {

        if (!reportsToId) {

            return "-";

        }


        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    reportsToId
            );


        return member
            ? getFullName(
                member
            )
            : "-";

    }


    /* =====================================================
       APPROVAL PERMISSION
       ===================================================== */

    function canApprove(
        member
    ) {

        if (
            !member
        ) {

            return false;

        }


        if (
            isAdmin()
        ) {

            return true;

        }


        if (
            getCurrentRole() ===
            "Manager"
        ) {

            if (
                member.role ===
                "Manager"
            ) {

                return false;

            }


            return isUnderCurrentUser(
                member
            );

        }


        return false;

    }


    /* =====================================================
       RENDER APPROVALS
       ===================================================== */

    function renderApprovals() {

        const container =
            $("teamApprovalList");


        if (!container) {

            return;

        }


        const pending =
            teamMembers.filter(
                member => {

                    return (
                        (
                            member.approvalStatus ||
                            "Pending"
                        ) ===
                        "Pending"
                    ) &&
                    canApprove(
                        member
                    );

                }
            );


        if (
            !pending.length
        ) {

            container.innerHTML = `

                <div class="empty-state">

                    No pending access requests.

                </div>

            `;

            return;

        }


        container.innerHTML =
            pending
                .map(
                    member =>
                        `

                            <div
                                class="approval-item"
                            >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            getFullName(
                                                member
                                            )
                                        )}
                                    </strong>

                                    <p>

                                        ${escapeHTML(
                                            member.role ||
                                            ""
                                        )}

                                        ·

                                        ${escapeHTML(
                                            member.email ||
                                            ""
                                        )}

                                    </p>

                                    <small>

                                        Reports to:
                                        ${escapeHTML(
                                            member.reportsToName ||
                                            "-"
                                        )}

                                    </small>

                                </div>


                                <div
                                    class="approval-actions"
                                >

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary"
                                        data-action="approve"
                                        data-id="${escapeHTML(
                                            getMemberId(
                                                member
                                            )
                                        )}"
                                    >
                                        Review & Approve
                                    </button>

                                </div>

                            </div>

                        `
                )
                .join("");

    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary() {

        const total =
            teamMembers.length;


        const admins =
            teamMembers.filter(
                member =>
                    member.role ===
                    "Admin"
            ).length;


        const managers =
            teamMembers.filter(
                member =>
                    member.role ===
                    "Manager"
            ).length;


        const employees =
            teamMembers.filter(
                member =>
                    member.role ===
                    "Employee"
            ).length;


        const active =
            teamMembers.filter(
                member =>
                    (
                        member.accountStatus ||
                        "Pending"
                    ) ===
                    "Active"
            ).length;


        const pending =
            teamMembers.filter(
                member =>
                    (
                        member.approvalStatus ||
                        "Pending"
                    ) ===
                    "Pending"
            ).length;


        setText(
            "totalTeamMembers",
            total
        );

        setText(
            "totalAdmins",
            admins
        );

        setText(
            "totalManagers",
            managers
        );

        setText(
            "totalEmployees",
            employees
        );

        setText(
            "activeTeamMembers",
            active
        );

        setText(
            "pendingTeamApprovals",
            pending
        );

    }


    function setText(
        id,
        value
    ) {

        const element =
            $(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    /* =====================================================
       VIEW MEMBER
       ===================================================== */

    function viewMember(
        id
    ) {

        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    id
            );


        if (!member) {

            return;

        }


        const content =
            $("teamDetailsContent");


        if (!content) {

            return;

        }


        content.innerHTML = `

            <div class="team-details-grid">

                <div>

                    <span>
                        Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            getFullName(
                                member
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Role
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.role ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Email
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.email ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Mobile
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.mobile ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Department
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.department ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Designation
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.designation ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Reports To
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.reportsToName ||
                            getReportsToName(
                                member.reportsToId
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Account Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.accountStatus ||
                            "Pending"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Approval Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.approvalStatus ||
                            "Pending"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Approved By
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.approvedByName ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Approval Date
                    </span>

                    <strong>
                        ${formatDate(
                            member.approvalDate
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Created
                    </span>

                    <strong>
                        ${formatDate(
                            member.createdAt
                        )}
                    </strong>

                </div>

            </div>


            <div
                class="team-detail-permissions"
            >

                <h3>
                    Module Permissions
                </h3>

                <div
                    class="permission-tags"
                >

                    ${
                        Array.isArray(
                            member.permissions
                        ) &&
                        member.permissions.length
                            ? member.permissions
                                .map(
                                    permission =>
                                        `<span>
                                            ${escapeHTML(
                                                permission
                                            )}
                                         </span>`
                                )
                                .join("")
                            : "<span>No permissions assigned</span>"
                    }

                </div>

            </div>


            ${
                member.notes
                    ? `

                        <div
                            class="team-detail-notes"
                        >

                            <h3>
                                Internal Notes
                            </h3>

                            <p>
                                ${escapeHTML(
                                    member.notes
                                )}
                            </p>

                        </div>

                      `
                    : ""
            }

        `;


        openModal(
            "teamDetailsModal"
        );

    }


    /* =====================================================
       EDIT MEMBER
       ===================================================== */

    function editMember(
        id
    ) {

        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    id
            );


        if (!member) {

            return;

        }


        if (
            !canManageMember(
                member
            )
        ) {

            alert(
                "You do not have permission to edit this user."
            );

            return;

        }


        editingMemberId =
            id;


        showTeamForm();


        setValue(
            "teamMemberId",
            id
        );

        setValue(
            "teamFirstName",
            member.firstName ||
            getFullName(
                member
            )
                .split(" ")[0]
        );

        setValue(
            "teamLastName",
            member.lastName ||
            ""
        );

        setValue(
            "teamMobile",
            member.mobile ||
            ""
        );

        setValue(
            "teamEmail",
            member.email ||
            ""
        );

        setValue(
            "teamRole",
            member.role ||
            ""
        );

        setValue(
            "teamDepartment",
            member.department ||
            ""
        );

        setValue(
            "teamDesignation",
            member.designation ||
            ""
        );

        setValue(
            "teamReportsTo",
            member.reportsToId ||
            ""
        );

        setValue(
            "teamAccountStatus",
            member.accountStatus ||
            "Pending"
        );

        setValue(
            "teamAccessLevel",
            member.accessLevel ||
            "Restricted"
        );

        setValue(
            "teamNotes",
            member.notes ||
            ""
        );


        updateRoleRules();


        if (
            Array.isArray(
                member.permissions
            )
        ) {

            document
                .querySelectorAll(
                    "[data-permission]"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            member.permissions
                                .includes(
                                    checkbox.dataset.permission
                                );

                    }
                );

        }

    }


    function setValue(
        id,
        value
    ) {

        const element =
            $(id);


        if (element) {

            element.value =
                value;

        }

    }


    /* =====================================================
       OPEN APPROVAL
       ===================================================== */

    function openApproval(
        id
    ) {

        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    id
            );


        if (!member) {

            return;

        }


        if (
            !canApprove(
                member
            )
        ) {

            alert(
                "You do not have permission to approve this account."
            );

            return;

        }


        selectedApprovalId =
            id;


        const content =
            $("teamApprovalContent");


        if (!content) {

            return;

        }


        content.innerHTML = `

            <div
                class="approval-review"
            >

                <div
                    class="approval-review-row"
                >

                    <span>
                        Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            getFullName(
                                member
                            )
                        )}
                    </strong>

                </div>


                <div
                    class="approval-review-row"
                >

                    <span>
                        Email
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.email ||
                            "-"
                        )}
                    </strong>

                </div>


                <div
                    class="approval-review-row"
                >

                    <span>
                        Role
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.role ||
                            "-"
                        )}
                    </strong>

                </div>


                <div
                    class="approval-review-row"
                >

                    <span>
                        Reports To
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.reportsToName ||
                            getReportsToName(
                                member.reportsToId
                            )
                        )}
                    </strong>

                </div>


                <div
                    class="approval-review-row"
                >

                    <span>
                        Requested By
                    </span>

                    <strong>
                        ${escapeHTML(
                            member.requestedByName ||
                            "-"
                        )}
                    </strong>

                </div>


                <div
                    class="approval-review-row"
                >

                    <span>
                        Requested
                    </span>

                    <strong>
                        ${formatDate(
                            member.createdAt
                        )}
                    </strong>

                </div>


                <div
                    class="approval-rule-highlight"
                >

                    <strong>
                        Required Approval:
                    </strong>

                    ${
                        member.role ===
                        "Manager"
                            ? "Admin"
                            : "Manager / Admin"
                    }

                </div>

            </div>

        `;


        openModal(
            "teamApprovalModal"
        );

    }


    /* =====================================================
       APPROVE MEMBER
       ===================================================== */

    async function approveMember() {

        if (
            !selectedApprovalId
        ) {

            return;

        }


        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    selectedApprovalId
            );


        if (!member) {

            return;

        }


        if (
            !canApprove(
                member
            )
        ) {

            alert(
                "You are not authorized to approve this account."
            );

            return;

        }


        const user =
            getCurrentUser();


        const updateData = {

            approvalStatus:
                "Approved",

            accountStatus:
                "Active",

            approvedById:
                user?.uid ||
                user?.id ||
                user?.userId ||
                "",

            approvedByName:
                user
                    ? getFullName(
                        user
                    )
                    : "",

            approvalDate:
                new Date(),

            updatedAt:
                new Date()

        };


        try {

            if (
                typeof window.approveTeamMember ===
                "function"
            ) {

                await window.approveTeamMember(
                    selectedApprovalId,
                    updateData
                );

            } else if (
                window.firebase &&
                window.db
            ) {

                await window.db
                    .collection(
                        "teamMembers"
                    )
                    .doc(
                        selectedApprovalId
                    )
                    .update(
                        updateData
                    );

            } else {

                Object.assign(
                    member,
                    updateData
                );

            }


            closeModal(
                "teamApprovalModal"
            );


            selectedApprovalId =
                null;


            await loadTeamMembers();


            alert(
                "Account approved successfully."
            );

        } catch (error) {

            console.error(
                "Approval error:",
                error
            );


            alert(
                "Unable to approve account."
            );

        }

    }


    /* =====================================================
       REJECT MEMBER
       ===================================================== */

    async function rejectMember() {

        if (
            !selectedApprovalId
        ) {

            return;

        }


        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    selectedApprovalId
            );


        if (!member) {

            return;

        }


        if (
            !canApprove(
                member
            )
        ) {

            return;

        }


        const updateData = {

            approvalStatus:
                "Rejected",

            accountStatus:
                "Inactive",

            rejectedAt:
                new Date(),

            updatedAt:
                new Date()

        };


        try {

            if (
                typeof window.rejectTeamMember ===
                "function"
            ) {

                await window.rejectTeamMember(
                    selectedApprovalId,
                    updateData
                );

            } else if (
                window.firebase &&
                window.db
            ) {

                await window.db
                    .collection(
                        "teamMembers"
                    )
                    .doc(
                        selectedApprovalId
                    )
                    .update(
                        updateData
                    );

            } else {

                Object.assign(
                    member,
                    updateData
                );

            }


            closeModal(
                "teamApprovalModal"
            );


            selectedApprovalId =
                null;


            await loadTeamMembers();


            alert(
                "Access request rejected."
            );

        } catch (error) {

            console.error(
                "Reject error:",
                error
            );


            alert(
                "Unable to reject request."
            );

        }

    }


    /* =====================================================
       OPEN DEACTIVATE MODAL
       ===================================================== */

    function openDeactivate(
        id
    ) {

        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    id
            );


        if (!member) {

            return;

        }


        if (
            !canManageMember(
                member
            )
        ) {

            alert(
                "You do not have permission to disable this account."
            );

            return;

        }


        selectedDeactivateId =
            id;


        const reason =
            $("deactivationReason");


        if (reason) {

            reason.value =
                "";

        }


        openModal(
            "deactivateTeamModal"
        );

    }


    /* =====================================================
       DEACTIVATE ACCOUNT
       ===================================================== */

    async function deactivateMember() {

        if (
            !selectedDeactivateId
        ) {

            return;

        }


        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    selectedDeactivateId
            );


        if (!member) {

            return;

        }


        const reason =
            $("deactivationReason")
                ?.value
                .trim() ||
            "";


        const user =
            getCurrentUser();


        const updateData = {

            accountStatus:
                "Inactive",

            accessDisabled:
                true,

            deactivatedById:
                user?.uid ||
                user?.id ||
                user?.userId ||
                "",

            deactivatedByName:
                user
                    ? getFullName(
                        user
                    )
                    : "",

            deactivatedAt:
                new Date(),

            deactivationReason:
                reason,

            updatedAt:
                new Date()

        };


        try {

            if (
                typeof window.deactivateTeamMember ===
                "function"
            ) {

                await window.deactivateTeamMember(
                    selectedDeactivateId,
                    updateData
                );

            } else if (
                window.firebase &&
                window.db
            ) {

                await window.db
                    .collection(
                        "teamMembers"
                    )
                    .doc(
                        selectedDeactivateId
                    )
                    .update(
                        updateData
                    );

            } else {

                Object.assign(
                    member,
                    updateData
                );

            }


            closeModal(
                "deactivateTeamModal"
            );


            selectedDeactivateId =
                null;


            await loadTeamMembers();


            alert(
                "ERP access has been disabled."
            );

        } catch (error) {

            console.error(
                "Deactivation error:",
                error
            );


            alert(
                "Unable to disable account."
            );

        }

    }


    /* =====================================================
       REACTIVATE
       ===================================================== */

    async function reactivateMember(
        id
    ) {

        const member =
            teamMembers.find(
                item =>
                    getMemberId(
                        item
                    ) ===
                    id
            );


        if (!member) {

            return;

        }


        if (
            !canManageMember(
                member
            )
        ) {

            alert(
                "You do not have permission to reactivate this account."
            );

            return;

        }


        const updateData = {

            accountStatus:
                "Active",

            accessDisabled:
                false,

            reactivatedAt:
                new Date(),

            updatedAt:
                new Date()

        };


        try {

            if (
                typeof window.reactivateTeamMember ===
                "function"
            ) {

                await window.reactivateTeamMember(
                    id,
                    updateData
                );

            } else if (
                window.firebase &&
                window.db
            ) {

                await window.db
                    .collection(
                        "teamMembers"
                    )
                    .doc(
                        id
                    )
                    .update(
                        updateData
                    );

            } else {

                Object.assign(
                    member,
                    updateData
                );

            }


            await loadTeamMembers();


            alert(
                "Account reactivated."
            );

        } catch (error) {

            console.error(
                "Reactivation error:",
                error
            );


            alert(
                "Unable to reactivate account."
            );

        }

    }


    /* =====================================================
       MODAL
       ===================================================== */

    function openModal(
        id
    ) {

        const modal =
            $(id);


        if (!modal) {

            return;

        }


        modal.hidden =
            false;

    }


    function closeModal(
        id
    ) {

        const modal =
            $(id);


        if (!modal) {

            return;

        }


        modal.hidden =
            true;

    }


    /* =====================================================
       LOADING
       ===================================================== */

    function showLoading(
        show
    ) {

        const element =
            $("teamLoading");


        if (!element) {

            return;

        }


        element.hidden =
            !show;

    }


    /* =====================================================
       FILTER EVENTS
       ===================================================== */

    function setupFilters() {

        [

            "teamSearch",

            "teamRoleFilter",

            "teamStatusFilter",

            "teamManagerFilter"

        ]
            .forEach(
                id => {

                    const element =
                        $(id);


                    if (!element) {

                        return;

                    }


                    element.addEventListener(
                        "input",
                        renderTeam
                    );


                    element.addEventListener(
                        "change",
                        renderTeam
                    );

                }
            );


        const clear =
            $("clearTeamFiltersBtn");


        if (clear) {

            clear.addEventListener(
                "click",
                function () {

                    setValue(
                        "teamSearch",
                        ""
                    );

                    setValue(
                        "teamRoleFilter",
                        ""
                    );

                    setValue(
                        "teamStatusFilter",
                        ""
                    );

                    setValue(
                        "teamManagerFilter",
                        ""
                    );


                    renderTeam();

                }
            );

        }

    }


    /* =====================================================
       TABLE ACTIONS
       ===================================================== */

    function setupTableActions() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (!button) {

                    return;

                }


                const action =
                    button.dataset.action;


                const id =
                    button.dataset.id;


                if (
                    !id
                ) {

                    return;

                }


                switch (
                    action
                ) {

                    case "view":

                        viewMember(
                            id
                        );

                        break;


                    case "edit":

                        editMember(
                            id
                        );

                        break;


                    case "approve":

                        openApproval(
                            id
                        );

                        break;


                    case "deactivate":

                        openDeactivate(
                            id
                        );

                        break;


                    case "reactivate":

                        reactivateMember(
                            id
                        );

                        break;

                }

            }
        );

    }


    /* =====================================================
       FORM EVENTS
       ===================================================== */

    function setupFormEvents() {

        const addButton =
            $("addTeamMemberBtn");


        if (addButton) {

            addButton.addEventListener(
                "click",
                function () {

                    resetTeamForm();

                    showTeamForm();

                    setupRoleDropdown();

                }
            );

        }


        const closeButton =
            $("closeTeamFormBtn");


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                hideTeamForm
            );

        }


        const cancelButton =
            $("cancelTeamMemberBtn");


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                hideTeamForm
            );

        }


        const form =
            $("teamMemberForm");


        if (form) {

            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const data =
                        collectFormData();


                    if (
                        !validateForm(
                            data
                        )
                    ) {

                        return;

                    }


                    const button =
                        $("saveTeamMemberBtn");


                    if (button) {

                        button.disabled =
                            true;

                        button.textContent =
                            "Saving...";

                    }


                    try {

                        const saved =
                            await saveMember(
                                data
                            );


                        if (
                            saved
                        ) {

                            hideTeamForm();

                            await loadTeamMembers();


                            alert(
                                editingMemberId
                                    ? "Team member updated."
                                    : "Access request submitted. Approval is required before activation."
                            );

                        }

                    } finally {

                        if (button) {

                            button.disabled =
                                false;

                            button.textContent =
                                "Submit Access Request";

                        }

                    }

                }
            );

        }


        const roleSelect =
            $("teamRole");


        if (roleSelect) {

            roleSelect.addEventListener(
                "change",
                updateRoleRules
            );

        }

    }


    /* =====================================================
       APPROVAL EVENTS
       ===================================================== */

    function setupApprovalEvents() {

        const approve =
            $("approveTeamApprovalBtn");


        if (approve) {

            approve.addEventListener(
                "click",
                approveMember
            );

        }


        const reject =
            $("rejectTeamApprovalBtn");


        if (reject) {

            reject.addEventListener(
                "click",
                rejectMember
            );

        }

    }


    /* =====================================================
       DEACTIVATION EVENTS
       ===================================================== */

    function setupDeactivationEvents() {

        const confirm =
            $("confirmDeactivateTeamBtn");


        if (confirm) {

            confirm.addEventListener(
                "click",
                deactivateMember
            );

        }


        const cancel =
            $("cancelDeactivateTeamBtn");


        if (cancel) {

            cancel.addEventListener(
                "click",
                function () {

                    closeModal(
                        "deactivateTeamModal"
                    );

                }
            );

        }

    }


    /* =====================================================
       MODAL CLOSE EVENTS
       ===================================================== */

    function setupModalEvents() {

        const mappings = [

            [
                "closeTeamDetailsModal",
                "teamDetailsModal"
            ],

            [
                "closeTeamDetailsBtn",
                "teamDetailsModal"
            ],

            [
                "closeTeamApprovalModal",
                "teamApprovalModal"
            ],

            [
                "closeDeactivateTeamModal",
                "deactivateTeamModal"
            ]

        ];


        mappings.forEach(
            pair => {

                const button =
                    $(pair[0]);


                if (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            closeModal(
                                pair[1]
                            );

                        }
                    );

                }

            }
        );


        document
            .querySelectorAll(
                ".modal-overlay"
            )
            .forEach(
                overlay => {

                    overlay.addEventListener(
                        "click",
                        function () {

                            const modal =
                                overlay.closest(
                                    ".modal"
                                );


                            if (
                                modal
                            ) {

                                modal.hidden =
                                    true;

                            }

                        }
                    );

                }
            );

    }


    /* =====================================================
       REFRESH
       ===================================================== */

    function setupRefresh() {

        const button =
            $("refreshTeamBtn");


        if (button) {

            button.addEventListener(
                "click",
                loadTeamMembers
            );

        }

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initTeamModule() {

        currentUser =
            getCurrentUser();


        setupRoleDropdown();

        setupFilters();

        setupTableActions();

        setupFormEvents();

        setupApprovalEvents();

        setupDeactivationEvents();

        setupModalEvents();

        setupRefresh();

        setDefaultPermissions();

        updateRoleRules();

        await loadTeamMembers();

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.TeamModule = {

        init:
            initTeamModule,

        load:
            loadTeamMembers,

        refresh:
            loadTeamMembers,

        getMembers:
            function () {

                return teamMembers;

            },

        getCurrentRole,

        canCreateRole,

        canManageMember,

        canApprove

    };


    /* =====================================================
       AUTO INIT
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initTeamModule
        );

    } else {

        initTeamModule();

    }


})();

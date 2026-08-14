/* =========================================================
   MY TOUR MITRA ERP
   VOUCHERS MODULE
   File: modules/vouchers/vouchers.js
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
       ===================================================== */

    const state = {

        vouchers: [],

        customers: [],

        editingId: null,

        loading: false

    };


    /* =====================================================
       HELPERS
       ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    function getDB() {

        if (window.db) {

            return window.db;

        }


        if (
            window.firebase &&
            typeof window.firebase.firestore === "function"
        ) {

            return window.firebase.firestore();

        }


        console.error(
            "Firestore database not found."
        );

        return null;

    }


    function getCollection(name) {

        const db = getDB();

        if (!db) {

            return null;

        }


        return db.collection(name);

    }


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


    function getDateValue(value) {

        if (!value) {

            return null;

        }


        if (
            value &&
            typeof value.toDate === "function"
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


    function formatDate(value) {

        const date =
            getDateValue(value);


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


    function dateInputValue(value) {

        const date =
            getDateValue(value);


        if (!date) {

            return "";

        }


        return [

            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

        ].join("-");

    }


    function todayString() {

        return dateInputValue(
            new Date()
        );

    }


    function setText(id, value) {

        const element =
            $(id);


        if (element) {

            element.textContent =
                value ?? "";

        }

    }


    function setValue(id, value) {

        const element =
            $(id);


        if (element) {

            element.value =
                value ?? "";

        }

    }


    function getValue(id) {

        const element =
            $(id);


        return element
            ? element.value.trim()
            : "";

    }


    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function showSuccess(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                "success"
            );

            return;

        }


        console.log(message);

    }


    function showError(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                "error"
            );

            return;

        }


        alert(message);

    }


    /* =====================================================
       LOADING
       ===================================================== */

    function setLoading(value) {

        state.loading =
            Boolean(value);


        const loader =
            $("vouchersLoading");


        if (loader) {

            loader.hidden =
                !state.loading;

        }

    }


    /* =====================================================
       VOUCHER NUMBER
       ===================================================== */

    function generateVoucherNumber() {

        const existing =
            state.vouchers
                .map(
                    voucher =>
                        voucher.voucherNumber
                )
                .filter(Boolean);


        let maxNumber = 0;


        existing.forEach(
            number => {

                const match =
                    String(number)
                        .match(
                            /(\d+)$/
                        );


                if (match) {

                    maxNumber =
                        Math.max(
                            maxNumber,
                            Number(
                                match[1]
                            )
                        );

                }

            }
        );


        const next =
            maxNumber + 1;


        return `VCH${String(next)
            .padStart(6, "0")}`;

    }


    /* =====================================================
       LOAD VOUCHERS
       ===================================================== */

    async function loadVouchers() {

        const collection =
            getCollection(
                "vouchers"
            );


        if (!collection) {

            return;

        }


        try {

            const snapshot =
                await collection
                    .get();


            state.vouchers =
                snapshot.docs.map(
                    doc => ({

                        id: doc.id,

                        ...doc.data()

                    })
                );


            state.vouchers.sort(
                (a, b) => {

                    const dateA =
                        getDateValue(
                            a.voucherDate
                        );


                    const dateB =
                        getDateValue(
                            b.voucherDate
                        );


                    if (
                        !dateA ||
                        !dateB
                    ) {

                        return 0;

                    }


                    return (
                        dateB -
                        dateA
                    );

                }
            );


            renderAll();

        } catch (error) {

            console.error(
                "Failed to load vouchers:",
                error
            );


            showError(
                "Unable to load vouchers."
            );

        }

    }


    /* =====================================================
       LOAD CUSTOMERS
       ===================================================== */

    async function loadCustomers() {

        const collection =
            getCollection(
                "customers"
            );


        if (!collection) {

            return;

        }


        try {

            const snapshot =
                await collection
                    .get();


            state.customers =
                snapshot.docs.map(
                    doc => ({

                        id: doc.id,

                        ...doc.data()

                    })
                );


            renderCustomerDropdown();

        } catch (error) {

            console.error(
                "Failed to load customers:",
                error
            );

        }

    }


    /* =====================================================
       CUSTOMER DROPDOWN
       ===================================================== */

    function getCustomerName(customer) {

        return (
            customer.name ||

            customer.customerName ||

            [
                customer.firstName,
                customer.lastName
            ]
                .filter(Boolean)
                .join(" ") ||

            customer.fullName ||

            customer.companyName ||

            "Unnamed Customer"
        );

    }


    function renderCustomerDropdown() {

        const select =
            $("voucherCustomer");


        if (!select) {

            return;

        }


        const current =
            select.value;


        select.innerHTML = `

            <option value="">
                Select Customer
            </option>

        `;


        state.customers.forEach(
            customer => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    customer.id;


                option.textContent =
                    getCustomerName(
                        customer
                    );


                select.appendChild(
                    option
                );

            }
        );


        if (current) {

            select.value =
                current;

        }

    }


    /* =====================================================
       AUTO-FILL CUSTOMER
       ===================================================== */

    function handleCustomerChange() {

        const customerId =
            getValue(
                "voucherCustomer"
            );


        if (!customerId) {

            return;

        }


        const customer =
            state.customers.find(
                item =>
                    item.id ===
                    customerId
            );


        if (!customer) {

            return;

        }


        setValue(
            "voucherGuestName",
            getCustomerName(
                customer
            )
        );


        setValue(
            "voucherGuestMobile",

            customer.mobile ||

            customer.phone ||

            customer.whatsapp ||

            ""
        );

    }


    /* =====================================================
       VOUCHER TYPE SECTIONS
       ===================================================== */

    function updateVoucherTypeSections() {

        const type =
            getValue(
                "voucherType"
            );


        const hotel =
            $("hotelVoucherSection");


        const cab =
            $("cabVoucherSection");


        const tour =
            $("tourVoucherSection");


        if (hotel) {

            hotel.hidden =
                type !== "Hotel";

        }


        if (cab) {

            cab.hidden =
                type !== "Cab";

        }


        if (tour) {

            tour.hidden =
                type !== "Tour";

        }

    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetForm() {

        const form =
            $("voucherForm");


        if (form) {

            form.reset();

        }


        state.editingId =
            null;


        setValue(
            "voucherId",
            ""
        );


        setValue(
            "voucherNumber",
            generateVoucherNumber()
        );


        setValue(
            "voucherDate",
            todayString()
        );


        setValue(
            "voucherStatus",
            "Draft"
        );


        updateVoucherTypeSections();

    }


    /* =====================================================
       OPEN FORM
       ===================================================== */

    function openForm(voucher = null) {

        const section =
            $("voucherFormSection");


        if (!section) {

            return;

        }


        section.hidden =
            false;


        if (!voucher) {

            resetForm();

            return;

        }


        state.editingId =
            voucher.id;


        setValue(
            "voucherId",
            voucher.id
        );


        setValue(
            "voucherNumber",
            voucher.voucherNumber
        );


        setValue(
            "voucherDate",
            dateInputValue(
                voucher.voucherDate
            )
        );


        setValue(
            "voucherType",
            voucher.voucherType
        );


        setValue(
            "voucherBookingId",
            voucher.bookingId
        );


        setValue(
            "voucherCustomer",
            voucher.customerId
        );


        setValue(
            "voucherGuestName",
            voucher.guestName
        );


        setValue(
            "voucherGuestMobile",
            voucher.guestMobile
        );


        setValue(
            "voucherPax",
            voucher.pax
        );


        setValue(
            "voucherSupplier",
            voucher.supplier
        );


        setValue(
            "voucherSupplierContact",
            voucher.supplierContact
        );


        setValue(
            "voucherServiceName",
            voucher.serviceName
        );


        setValue(
            "voucherLocation",
            voucher.location
        );


        setValue(
            "voucherConfirmationNo",
            voucher.confirmationNo
        );


        /* Hotel */

        setValue(
            "hotelCheckIn",
            dateInputValue(
                voucher.hotelCheckIn
            )
        );


        setValue(
            "hotelCheckOut",
            dateInputValue(
                voucher.hotelCheckOut
            )
        );


        setValue(
            "hotelNights",
            voucher.hotelNights
        );


        setValue(
            "hotelRooms",
            voucher.hotelRooms
        );


        setValue(
            "hotelRoomType",
            voucher.hotelRoomType
        );


        setValue(
            "hotelMealPlan",
            voucher.hotelMealPlan
        );


        setValue(
            "hotelAddress",
            voucher.hotelAddress
        );


        /* Cab */

        setValue(
            "cabPickupDate",
            dateInputValue(
                voucher.cabPickupDate
            )
        );


        setValue(
            "cabPickupTime",
            voucher.cabPickupTime
        );


        setValue(
            "cabPickupLocation",
            voucher.cabPickupLocation
        );


        setValue(
            "cabDropLocation",
            voucher.cabDropLocation
        );


        setValue(
            "cabVehicle",
            voucher.cabVehicle
        );


        setValue(
            "cabVehicleNumber",
            voucher.cabVehicleNumber
        );


        setValue(
            "cabDriverName",
            voucher.cabDriverName
        );


        setValue(
            "cabDriverMobile",
            voucher.cabDriverMobile
        );


        /* Tour */

        setValue(
            "tourStartDate",
            dateInputValue(
                voucher.tourStartDate
            )
        );


        setValue(
            "tourEndDate",
            dateInputValue(
                voucher.tourEndDate
            )
        );


        setValue(
            "tourDuration",
            voucher.tourDuration
        );


        setValue(
            "tourGuide",
            voucher.tourGuide
        );


        setValue(
            "tourDetails",
            voucher.tourDetails
        );


        /* Common */

        setValue(
            "voucherInstructions",
            voucher.instructions
        );


        setValue(
            "voucherStatus",
            voucher.status ||
            "Draft"
        );


        updateVoucherTypeSections();

    }


    /* =====================================================
       CLOSE FORM
       ===================================================== */

    function closeForm() {

        const section =
            $("voucherFormSection");


        if (section) {

            section.hidden =
                true;

        }


        state.editingId =
            null;

    }


    /* =====================================================
       COLLECT FORM DATA
       ===================================================== */

    function collectFormData() {

        return {

            voucherNumber:
                getValue(
                    "voucherNumber"
                ),

            voucherDate:
                getValue(
                    "voucherDate"
                ),

            voucherType:
                getValue(
                    "voucherType"
                ),

            bookingId:
                getValue(
                    "voucherBookingId"
                ),

            customerId:
                getValue(
                    "voucherCustomer"
                ),

            guestName:
                getValue(
                    "voucherGuestName"
                ),

            guestMobile:
                getValue(
                    "voucherGuestMobile"
                ),

            pax:
                Number(
                    getValue(
                        "voucherPax"
                    )
                ) || 0,

            supplier:
                getValue(
                    "voucherSupplier"
                ),

            supplierContact:
                getValue(
                    "voucherSupplierContact"
                ),

            serviceName:
                getValue(
                    "voucherServiceName"
                ),

            location:
                getValue(
                    "voucherLocation"
                ),

            confirmationNo:
                getValue(
                    "voucherConfirmationNo"
                ),


            /* Hotel */

            hotelCheckIn:
                getValue(
                    "hotelCheckIn"
                ),

            hotelCheckOut:
                getValue(
                    "hotelCheckOut"
                ),

            hotelNights:
                Number(
                    getValue(
                        "hotelNights"
                    )
                ) || 0,

            hotelRooms:
                Number(
                    getValue(
                        "hotelRooms"
                    )
                ) || 0,

            hotelRoomType:
                getValue(
                    "hotelRoomType"
                ),

            hotelMealPlan:
                getValue(
                    "hotelMealPlan"
                ),

            hotelAddress:
                getValue(
                    "hotelAddress"
                ),


            /* Cab */

            cabPickupDate:
                getValue(
                    "cabPickupDate"
                ),

            cabPickupTime:
                getValue(
                    "cabPickupTime"
                ),

            cabPickupLocation:
                getValue(
                    "cabPickupLocation"
                ),

            cabDropLocation:
                getValue(
                    "cabDropLocation"
                ),

            cabVehicle:
                getValue(
                    "cabVehicle"
                ),

            cabVehicleNumber:
                getValue(
                    "cabVehicleNumber"
                ),

            cabDriverName:
                getValue(
                    "cabDriverName"
                ),

            cabDriverMobile:
                getValue(
                    "cabDriverMobile"
                ),


            /* Tour */

            tourStartDate:
                getValue(
                    "tourStartDate"
                ),

            tourEndDate:
                getValue(
                    "tourEndDate"
                ),

            tourDuration:
                getValue(
                    "tourDuration"
                ),

            tourGuide:
                getValue(
                    "tourGuide"
                ),

            tourDetails:
                getValue(
                    "tourDetails"
                ),


            instructions:
                getValue(
                    "voucherInstructions"
                ),

            status:
                getValue(
                    "voucherStatus"
                ) || "Draft"

        };

    }


    /* =====================================================
       VALIDATE
       ===================================================== */

    function validateVoucher(data) {

        if (!data.voucherDate) {

            showError(
                "Voucher date is required."
            );

            return false;

        }


        if (!data.voucherType) {

            showError(
                "Please select voucher type."
            );

            return false;

        }


        if (!data.serviceName) {

            showError(
                "Service name is required."
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       SAVE VOUCHER
       ===================================================== */

    async function saveVoucher(event) {

        event.preventDefault();


        const collection =
            getCollection(
                "vouchers"
            );


        if (!collection) {

            showError(
                "Firestore is not available."
            );

            return;

        }


        const data =
            collectFormData();


        if (
            !validateVoucher(data)
        ) {

            return;

        }


        setLoading(true);


        try {

            if (state.editingId) {

                await collection
                    .doc(
                        state.editingId
                    )
                    .update({

                        ...data,

                        updatedAt:
                            new Date()

                    });


                showSuccess(
                    "Voucher updated successfully."
                );

            } else {

                await collection
                    .add({

                        ...data,

                        createdAt:
                            new Date(),

                        updatedAt:
                            new Date()

                    });


                showSuccess(
                    "Voucher created successfully."
                );

            }


            closeForm();

            await loadVouchers();

        } catch (error) {

            console.error(
                "Failed to save voucher:",
                error
            );


            showError(
                "Unable to save voucher."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       DELETE VOUCHER
       ===================================================== */

    async function deleteVoucher(id) {

        if (!id) {

            return;

        }


        const voucher =
            state.vouchers.find(
                item =>
                    item.id === id
            );


        if (!voucher) {

            return;

        }


        const confirmed =
            confirm(
                `Delete voucher ${voucher.voucherNumber || ""}?`
            );


        if (!confirmed) {

            return;

        }


        const collection =
            getCollection(
                "vouchers"
            );


        if (!collection) {

            return;

        }


        setLoading(true);


        try {

            await collection
                .doc(id)
                .delete();


            showSuccess(
                "Voucher deleted successfully."
            );


            await loadVouchers();

        } catch (error) {

            console.error(
                "Failed to delete voucher:",
                error
            );


            showError(
                "Unable to delete voucher."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       CUSTOMER DISPLAY
       ===================================================== */

    function getCustomerDisplay(
        voucher
    ) {

        if (
            voucher.customerName
        ) {

            return voucher.customerName;

        }


        const customer =
            state.customers.find(
                item =>
                    item.id ===
                    voucher.customerId
            );


        if (customer) {

            return getCustomerName(
                customer
            );

        }


        return (
            voucher.guestName ||
            "-"
        );

    }


    /* =====================================================
       STATUS BADGE
       ===================================================== */

    function statusBadge(status) {

        const normalized =
            String(
                status ||
                "Draft"
            )
                .toLowerCase();


        let className =
            "status-badge";


        if (
            normalized ===
            "confirmed"
        ) {

            className +=
                " status-confirmed";

        } else if (
            normalized ===
            "issued"
        ) {

            className +=
                " status-issued";

        } else if (
            normalized ===
            "cancelled"
        ) {

            className +=
                " status-cancelled";

        } else {

            className +=
                " status-draft";

        }


        return `

            <span
                class="${className}"
            >
                ${escapeHTML(
                    status || "Draft"
                )}
            </span>

        `;

    }


    /* =====================================================
       RENDER TABLE
       ===================================================== */

    function renderTable() {

        const tbody =
            $("vouchersTableBody");


        if (!tbody) {

            return;

        }


        const vouchers =
            getFilteredVouchers();


        if (!vouchers.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="empty-state"
                    >
                        No vouchers found.
                    </td>

                </tr>

            `;

            return;

        }


        tbody.innerHTML =
            vouchers.map(
                voucher => `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    voucher.voucherNumber ||
                                    "-"
                                )}
                            </strong>

                        </td>


                        <td>
                            ${formatDate(
                                voucher.voucherDate
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                voucher.voucherType ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                getCustomerDisplay(
                                    voucher
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                voucher.serviceName ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                voucher.supplier ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                voucher.bookingId ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${statusBadge(
                                voucher.status
                            )}
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
                                        voucher.id
                                    )}"
                                >
                                    View
                                </button>


                                <button
                                    type="button"
                                    class="btn btn-sm btn-secondary"
                                    data-action="edit"
                                    data-id="${escapeHTML(
                                        voucher.id
                                    )}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="btn btn-sm btn-danger"
                                    data-action="delete"
                                    data-id="${escapeHTML(
                                        voucher.id
                                    )}"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>

                `
            ).join("");

    }


    /* =====================================================
       FILTER
       ===================================================== */

    function getFilteredVouchers() {

        const search =
            getValue(
                "voucherSearch"
            )
                .toLowerCase();


        const type =
            getValue(
                "voucherTypeFilter"
            );


        const status =
            getValue(
                "voucherStatusFilter"
            );


        const fromDate =
            getValue(
                "voucherFromDate"
            );


        const toDate =
            getValue(
                "voucherToDate"
            );


        return state.vouchers.filter(
            voucher => {

                const searchable = [

                    voucher.voucherNumber,

                    voucher.voucherType,

                    getCustomerDisplay(
                        voucher
                    ),

                    voucher.serviceName,

                    voucher.supplier,

                    voucher.bookingId,

                    voucher.location

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                if (
                    search &&
                    !searchable.includes(
                        search
                    )
                ) {

                    return false;

                }


                if (
                    type &&
                    voucher.voucherType !==
                    type
                ) {

                    return false;

                }


                if (
                    status &&
                    (
                        voucher.status ||
                        "Draft"
                    ) !== status
                ) {

                    return false;

                }


                const voucherDate =
                    dateInputValue(
                        voucher.voucherDate
                    );


                if (
                    fromDate &&
                    voucherDate <
                    fromDate
                ) {

                    return false;

                }


                if (
                    toDate &&
                    voucherDate >
                    toDate
                ) {

                    return false;

                }


                return true;

            }
        );

    }


    function clearFilters() {

        setValue(
            "voucherSearch",
            ""
        );


        setValue(
            "voucherTypeFilter",
            ""
        );


        setValue(
            "voucherStatusFilter",
            ""
        );


        setValue(
            "voucherFromDate",
            ""
        );


        setValue(
            "voucherToDate",
            ""
        );


        renderTable();

    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function renderSummary() {

        const vouchers =
            state.vouchers;


        setText(
            "totalVouchers",
            vouchers.length
        );


        setText(
            "hotelVoucherCount",

            vouchers.filter(
                voucher =>
                    voucher.voucherType ===
                    "Hotel"
            ).length

        );


        setText(
            "cabVoucherCount",

            vouchers.filter(
                voucher =>
                    voucher.voucherType ===
                    "Cab"
            ).length

        );


        setText(
            "tourVoucherCount",

            vouchers.filter(
                voucher =>
                    voucher.voucherType ===
                    "Tour"
            ).length

        );

    }


    /* =====================================================
       VIEW DETAILS
       ===================================================== */

    function viewVoucher(id) {

        const voucher =
            state.vouchers.find(
                item =>
                    item.id === id
            );


        if (!voucher) {

            return;

        }


        const modal =
            $("voucherDetailsModal");


        const content =
            $("voucherDetailsContent");


        if (
            !modal ||
            !content
        ) {

            return;

        }


        const customer =
            getCustomerDisplay(
                voucher
            );


        content.innerHTML = `

            <div class="details-grid">

                <div class="detail-item">

                    <span>
                        Voucher No.
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.voucherNumber ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Date
                    </span>

                    <strong>
                        ${formatDate(
                            voucher.voucherDate
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.voucherType ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.status ||
                            "Draft"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHTML(
                            customer
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Guest
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.guestName ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Service
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.serviceName ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Supplier
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.supplier ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Location
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.location ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Booking ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            voucher.bookingId ||
                            "-"
                        )}
                    </strong>

                </div>

            </div>


            <div class="detail-section">

                <h3>
                    Instructions / Remarks
                </h3>

                <p>
                    ${escapeHTML(
                        voucher.instructions ||
                        "No additional instructions."
                    )}
                </p>

            </div>

        `;


        modal.hidden =
            false;


        modal.dataset.voucherId =
            id;

    }


    /* =====================================================
       CLOSE DETAILS MODAL
       ===================================================== */

    function closeDetailsModal() {

        const modal =
            $("voucherDetailsModal");


        if (modal) {

            modal.hidden =
                true;

            delete modal.dataset.voucherId;

        }

    }


    /* =====================================================
       PDF HOOK
       ===================================================== */

    function generatePDF(id) {

        const voucherId =
            id ||
            $("voucherDetailsModal")
                ?.dataset
                .voucherId;


        if (!voucherId) {

            showError(
                "Voucher not selected."
            );

            return;

        }


        const voucher =
            state.vouchers.find(
                item =>
                    item.id ===
                    voucherId
            );


        if (!voucher) {

            showError(
                "Voucher not found."
            );

            return;

        }


        /*
         * PDF JS will be connected here later.
         */

        if (
            window.VouchersPDF &&
            typeof window.VouchersPDF.generate ===
            "function"
        ) {

            window.VouchersPDF.generate(
                voucher
            );

            return;

        }


        showSuccess(
            "Voucher PDF module will be connected next."
        );

    }


    /* =====================================================
       TABLE ACTIONS
       ===================================================== */

    function handleTableAction(event) {

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


        if (action === "view") {

            viewVoucher(id);

        }


        if (action === "edit") {

            const voucher =
                state.vouchers.find(
                    item =>
                        item.id === id
                );


            if (voucher) {

                openForm(
                    voucher
                );

            }

        }


        if (action === "delete") {

            deleteVoucher(id);

        }

    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {

        $("addVoucherBtn")
            ?.addEventListener(
                "click",
                () =>
                    openForm()
            );


        $("refreshVouchersBtn")
            ?.addEventListener(
                "click",
                async () => {

                    setLoading(true);

                    try {

                        await Promise.all([

                            loadVouchers(),

                            loadCustomers()

                        ]);

                    } finally {

                        setLoading(false);

                    }

                }
            );


        $("closeVoucherFormBtn")
            ?.addEventListener(
                "click",
                closeForm
            );


        $("cancelVoucherBtn")
            ?.addEventListener(
                "click",
                closeForm
            );


        $("voucherForm")
            ?.addEventListener(
                "submit",
                saveVoucher
            );


        $("voucherType")
            ?.addEventListener(
                "change",
                updateVoucherTypeSections
            );


        $("voucherCustomer")
            ?.addEventListener(
                "change",
                handleCustomerChange
            );


        $("voucherSearch")
            ?.addEventListener(
                "input",
                renderTable
            );


        $("voucherTypeFilter")
            ?.addEventListener(
                "change",
                renderTable
            );


        $("voucherStatusFilter")
            ?.addEventListener(
                "change",
                renderTable
            );


        $("voucherFromDate")
            ?.addEventListener(
                "change",
                renderTable
            );


        $("voucherToDate")
            ?.addEventListener(
                "change",
                renderTable
            );


        $("clearVoucherFiltersBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        $("vouchersTableBody")
            ?.addEventListener(
                "click",
                handleTableAction
            );


        $("closeVoucherDetailsModal")
            ?.addEventListener(
                "click",
                closeDetailsModal
            );


        $("closeVoucherDetailsBtn")
            ?.addEventListener(
                "click",
                closeDetailsModal
            );


        $("generateVoucherPdfBtn")
            ?.addEventListener(
                "click",
                () =>
                    generatePDF()
            );


        $("voucherDetailsModal")
            ?.querySelector(
                ".modal-overlay"
            )
            ?.addEventListener(
                "click",
                closeDetailsModal
            );

    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderSummary();

        renderCustomerDropdown();

        renderTable();

        updateVoucherTypeSections();

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function init() {

        setLoading(true);


        try {

            bindEvents();

            await Promise.all([

                loadVouchers(),

                loadCustomers()

            ]);


            resetForm();

            renderAll();

        } catch (error) {

            console.error(
                "Voucher module initialization failed:",
                error
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.VouchersModule = {

        init,

        refresh:
            loadVouchers,

        openForm,

        closeForm,

        viewVoucher,

        generatePDF,

        getVouchers:
            () =>
                [...state.vouchers]

    };


    /* =====================================================
       AUTO INITIALIZE
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }


})();

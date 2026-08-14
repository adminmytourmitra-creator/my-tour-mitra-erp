// ============================================================
// MY TOUR MITRA ERP
// QUOTATION PDF GENERATOR
// ============================================================
//
// COMPLETE REPLACEMENT VERSION
//
// Reads:
// - Company Settings from localStorage
// - Logo from localStorage
// - QR Code from localStorage
// - Package itinerary
// - Selected Hotel Master data
// - Selected Cab Master data
// - Pricing
// - Payment details
//
// Settings key:
// myTourMitraSettings
//
// ============================================================

const SETTINGS_KEY = "myTourMitraSettings";

// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {
    companyName: "My Tour Mitra",
    tagline: "Travel ERP",

    logoDataUrl: "",

    phone: "",
    whatsapp: "",
    email: "",
    website: "",

    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",

    gstNumber: "",
    panNumber: "",

    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",

    qrCodeDataUrl: "",

    quotationTerms: "",
    quotationFooter: ""
};


// ============================================================
// SETTINGS
// ============================================================

function getCompanySettings() {

    try {

        const saved =
            localStorage.getItem(SETTINGS_KEY);

        if (!saved) {
            return {
                ...DEFAULT_SETTINGS
            };
        }

        const parsed =
            JSON.parse(saved);

        return {
            ...DEFAULT_SETTINGS,
            ...(parsed &&
            typeof parsed === "object"
                ? parsed
                : {})
        };

    } catch (error) {

        console.error(
            "Settings loading error:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}


// ============================================================
// GENERAL VALUE HELPER
// ============================================================

function getValue(
    object,
    paths,
    fallback = ""
) {

    if (
        !object ||
        typeof object !== "object"
    ) {
        return fallback;
    }

    for (
        const path of paths
    ) {

        if (!path) continue;

        const parts =
            String(path).split(".");

        let current = object;

        let found = true;

        for (
            const part of parts
        ) {

            if (
                current === undefined ||
                current === null
            ) {

                found = false;
                break;
            }

            if (
                Object.prototype.hasOwnProperty.call(
                    current,
                    part
                )
            ) {

                current =
                    current[part];

            } else {

                // Case-insensitive fallback
                const key =
                    Object.keys(current)
                        .find(
                            k =>
                                k.toLowerCase() ===
                                part.toLowerCase()
                        );

                if (!key) {

                    found = false;
                    break;

                }

                current =
                    current[key];
            }
        }

        if (
            found &&
            current !== undefined &&
            current !== null &&
            current !== ""
        ) {

            return current;
        }
    }

    return fallback;
}


// ============================================================
// DEEP FIND
// ============================================================
//
// Used when quotation structure changes slightly.
//
// ============================================================

function deepFind(
    object,
    keys,
    fallback = ""
) {

    if (
        object === null ||
        object === undefined
    ) {
        return fallback;
    }

    const wanted =
        new Set(
            keys.map(
                key =>
                    String(key)
                        .toLowerCase()
            )
        );

    function search(
        value,
        depth
    ) {

        if (
            depth > 8 ||
            value === null ||
            value === undefined
        ) {
            return undefined;
        }

        if (
            typeof value !== "object"
        ) {
            return undefined;
        }

        for (
            const key of Object.keys(value)
        ) {

            if (
                wanted.has(
                    key.toLowerCase()
                )
            ) {

                const found =
                    value[key];

                if (
                    found !== undefined &&
                    found !== null &&
                    found !== ""
                ) {

                    return found;
                }
            }
        }

        for (
            const key of Object.keys(value)
        ) {

            const result =
                search(
                    value[key],
                    depth + 1
                );

            if (
                result !== undefined &&
                result !== null &&
                result !== ""
            ) {

                return result;
            }
        }

        return undefined;
    }

    const result =
        search(object, 0);

    return result !== undefined
        ? result
        : fallback;
}


// ============================================================
// NUMBER HELPER
// ============================================================

function getNumber(
    object,
    paths,
    fallback = 0
) {

    let value =
        getValue(
            object,
            paths,
            undefined
        );

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        value =
            deepFind(
                object,
                paths
                    .map(
                        p =>
                            String(p)
                                .split(".")
                                .pop()
                    ),
                undefined
            );
    }

    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : fallback;
    }

    const number =
        Number(
            String(value ?? "")
                .replace(/[₹,\s]/g, "")
                .replace(/%/g, "")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : fallback;
}


// ============================================================
// ARRAY NORMALIZER
// ============================================================

function normalizeArray(value) {

    if (
        Array.isArray(value)
    ) {
        return value;
    }

    if (
        value &&
        typeof value === "object"
    ) {

        return Object.values(value);
    }

    return [];
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(
    value
) {

    const number =
        Number(value || 0);

    return (
        "₹" +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}


// ============================================================
// DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }

    try {

        const raw =
            String(value);

        const date =
            new Date(
                raw.length === 10
                    ? `${raw}T00:00:00`
                    : raw
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return escapeHtml(
                raw
            );
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return escapeHtml(
            value
        );
    }
}


// ============================================================
// TEXT VALUE
// ============================================================

function firstText(
    object,
    paths,
    fallback = "-"
) {

    let value =
        getValue(
            object,
            paths,
            undefined
        );

    if (
        value === undefined
    ) {

        value =
            deepFind(
                object,
                paths
                    .map(
                        p =>
                            String(p)
                                .split(".")
                                .pop()
                    ),
                undefined
            );
    }

    if (
        value &&
        typeof value === "object"
    ) {

        value =
            getValue(
                value,
                [
                    "name",
                    "title",
                    "label",
                    "value",
                    "text"
                ],
                fallback
            );
    }

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return fallback;
    }

    return String(value);
}


// ============================================================
// RICH TEXT
// ============================================================

function renderRichText(
    value
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return "";
    }

    const container =
        document.createElement(
            "div"
        );

    container.innerHTML =
        String(value);

    container
        .querySelectorAll(
            "script,style,iframe,object,embed"
        )
        .forEach(
            element =>
                element.remove()
        );

    return container.innerHTML;
}


// ============================================================
// COMPANY LOGO
// ============================================================

function getLogo(
    settings
) {

    return getValue(
        settings,
        [
            "logoDataUrl",
            "companyLogo",
            "logo",
            "logoUrl",
            "company.logoDataUrl"
        ],
        ""
    );
}


// ============================================================
// QR CODE
// ============================================================

function getQrCode(
    settings
) {

    return getValue(
        settings,
        [
            "qrCodeDataUrl",
            "upiQrCode",
            "qrCode",
            "paymentQr",
            "payment.qrCodeDataUrl"
        ],
        ""
    );
}


// ============================================================
// COMPANY ADDRESS
// ============================================================

function getCompanyAddress(
    settings
) {

    return [
        settings.address,
        settings.city,
        settings.state,
        settings.pincode,
        settings.country
    ]
        .filter(
            value =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
        )
        .join(", ");
}


// ============================================================
// COMPANY CONTACT
// ============================================================

function getContactLine(
    settings
) {

    const parts = [];

    if (settings.phone) {

        parts.push(
            `Phone: ${settings.phone}`
        );
    }

    if (settings.whatsapp) {

        parts.push(
            `WhatsApp: ${settings.whatsapp}`
        );
    }

    if (settings.email) {

        parts.push(
            `Email: ${settings.email}`
        );
    }

    if (settings.website) {

        parts.push(
            `Website: ${settings.website}`
        );
    }

    return parts.join(
        "  |  "
    );
}


// ============================================================
// PACKAGE DATA
// ============================================================

function getQuotationPackage(
    quotation
) {

    return getValue(
        quotation,
        [
            "packageData",
            "packageDetails",
            "packageInfo",
            "selectedPackage",
            "packageMaster",
            "packageObject",
            "packageDetails.data"
        ],
        null
    );
}


// ============================================================
// ITINERARY
// ============================================================

function getItinerary(
    quotation
) {

    const pkg =
        getQuotationPackage(
            quotation
        );

    let value =
        getValue(
            quotation,
            [
                "itinerary",
                "packageItinerary",
                "itineraryDays",
                "days",
                "dayWiseItinerary",
                "dayWisePlan",
                "dayWise"
            ],
            undefined
        );

    if (
        value !== undefined
    ) {

        return normalizeArray(
            value
        );
    }

    if (pkg) {

        value =
            getValue(
                pkg,
                [
                    "itinerary",
                    "itineraryDays",
                    "days",
                    "dayWiseItinerary",
                    "dayWisePlan",
                    "dayWise"
                ],
                undefined
            );

        if (
            value !== undefined
        ) {

            return normalizeArray(
                value
            );
        }
    }

    return [];
}


// ============================================================
// HOTEL MASTER RESOLVER
// ============================================================

function getHotelMasterList() {

    const possibleKeys = [
        "myTourMitraHotels",
        "hotels",
        "hotelMaster",
        "hotelMasterData",
        "hotelData"
    ];

    for (
        const key of possibleKeys
    ) {

        try {

            const saved =
                localStorage.getItem(
                    key
                );

            if (saved) {

                const parsed =
                    JSON.parse(saved);

                const list =
                    normalizeArray(
                        parsed
                    );

                if (list.length) {
                    return list;
                }
            }

        } catch {
            // continue
        }
    }

    return [];
}


function getCabMasterList() {

    const possibleKeys = [
        "myTourMitraCabs",
        "cabs",
        "cabMaster",
        "cabMasterData",
        "cabData"
    ];

    for (
        const key of possibleKeys
    ) {

        try {

            const saved =
                localStorage.getItem(
                    key
                );

            if (saved) {

                const parsed =
                    JSON.parse(saved);

                const list =
                    normalizeArray(
                        parsed
                    );

                if (list.length) {
                    return list;
                }
            }

        } catch {
            // continue
        }
    }

    return [];
}


// ============================================================
// ENTITY UNWRAPPER
// ============================================================

function unwrapEntity(
    item,
    keys
) {

    if (
        !item ||
        typeof item !== "object"
    ) {

        return item;
    }

    for (
        const key of keys
    ) {

        const nested =
            item[key];

        if (
            nested &&
            typeof nested === "object" &&
            !Array.isArray(nested)
        ) {

            return {
                ...nested,
                ...item
            };
        }
    }

    return item;
}


// ============================================================
// HOTEL DATA
// ============================================================

function getHotels(
    quotation
) {

    const pkg =
        getQuotationPackage(
            quotation
        );

    let hotels =
        getValue(
            quotation,
            [
                "hotels",
                "hotelDetails",
                "selectedHotels",
                "hotelData",
                "hotelSelections",
                "packageHotels",
                "selectedHotel",
                "hotelSelection"
            ],
            undefined
        );

    if (
        hotels === undefined &&
        pkg
    ) {

        hotels =
            getValue(
                pkg,
                [
                    "hotels",
                    "hotelDetails",
                    "hotelSelections",
                    "selectedHotels"
                ],
                undefined
            );
    }

    return normalizeArray(
        hotels
    );
}


// ============================================================
// RESOLVE HOTEL MASTER ID
// ============================================================

function resolveHotel(
    item
) {

    if (
        typeof item !== "string"
    ) {

        return unwrapEntity(
            item,
            [
                "hotelData",
                "selectedHotel",
                "hotel",
                "propertyData"
            ]
        );
    }

    const master =
        getHotelMasterList();

    const found =
        master.find(
            hotel => {

                const id =
                    firstText(
                        hotel,
                        [
                            "hotelId",
                            "id",
                            "HotelID"
                        ],
                        ""
                    );

                const name =
                    firstText(
                        hotel,
                        [
                            "hotelName",
                            "name",
                            "propertyName"
                        ],
                        ""
                    );

                return (
                    String(id) ===
                    String(item)
                    ||
                    String(name).toLowerCase() ===
                    String(item).toLowerCase()
                );
            }
        );

    return found || {
        hotelName: item
    };
}


// ============================================================
// CAB DATA
// ============================================================

function getTransport(
    quotation
) {

    const pkg =
        getQuotationPackage(
            quotation
        );

    let transport =
        getValue(
            quotation,
            [
                "transportation",
                "transport",
                "cabDetails",
                "selectedCabs",
                "selectedCab",
                "cab",
                "vehicle",
                "vehicles",
                "cabSelection",
                "cabSelections"
            ],
            undefined
        );

    if (
        transport === undefined &&
        pkg
    ) {

        transport =
            getValue(
                pkg,
                [
                    "transportation",
                    "transport",
                    "cabDetails",
                    "selectedCabs",
                    "selectedCab",
                    "cab",
                    "vehicle",
                    "vehicles"
                ],
                undefined
            );
    }

    return normalizeArray(
        transport
    );
}


// ============================================================
// RESOLVE CAB MASTER
// ============================================================

function resolveCab(
    item
) {

    if (
        typeof item !== "string"
    ) {

        return unwrapEntity(
            item,
            [
                "cabData",
                "selectedCab",
                "cab",
                "vehicleData",
                "selectedVehicle",
                "vehicle"
            ]
        );
    }

    const master =
        getCabMasterList();

    const found =
        master.find(
            cab => {

                const id =
                    firstText(
                        cab,
                        [
                            "cabId",
                            "id",
                            "vehicleId"
                        ],
                        ""
                    );

                const name =
                    firstText(
                        cab,
                        [
                            "vehicleName",
                            "cabName",
                            "name",
                            "vehicle"
                        ],
                        ""
                    );

                return (
                    String(id) ===
                    String(item)
                    ||
                    String(name).toLowerCase() ===
                    String(item).toLowerCase()
                );
            }
        );

    return found || {
        vehicleName: item
    };
}


// ============================================================
// BUILD HOTEL HTML
// ============================================================

function buildHotelHTML(
    hotels
) {

    if (!hotels.length) {

        return `
            <tr>
                <td colspan="4" class="muted">
                    Hotel details not added.
                </td>
            </tr>
        `;
    }

    return hotels
        .map(
            item => {

                const hotel =
                    resolveHotel(
                        item
                    );

                const destination =
                    firstText(
                        hotel,
                        [
                            "destination",
                            "city",
                            "location",
                            "place",
                            "destinationName",
                            "cityName"
                        ],
                        "-"
                    );

                const hotelName =
                    firstText(
                        hotel,
                        [
                            "hotelName",
                            "name",
                            "propertyName",
                            "selectedHotelName",
                            "hotel",
                            "property",
                            "title"
                        ],
                        "-"
                    );

                const room =
                    firstText(
                        hotel,
                        [
                            "roomType",
                            "room",
                            "roomCategory",
                            "rooms",
                            "category",
                            "roomName"
                        ],
                        "-"
                    );

                const meal =
                    firstText(
                        hotel,
                        [
                            "mealPlan",
                            "meal",
                            "meals",
                            "mealType",
                            "meal_plan"
                        ],
                        "-"
                    );

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                destination
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    hotelName
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                room
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                meal
                            )}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");
}


// ============================================================
// BUILD TRANSPORT HTML
// ============================================================

function buildTransportHTML(
    transport
) {

    if (!transport.length) {

        return `
            <tr>
                <td colspan="4" class="muted">
                    Transportation details not added.
                </td>
            </tr>
        `;
    }

    return transport
        .map(
            item => {

                const cab =
                    resolveCab(
                        item
                    );

                const vehicle =
                    firstText(
                        cab,
                        [
                            "vehicleName",
                            "vehicle",
                            "cabName",
                            "name",
                            "vehicle_name",
                            "cab",
                            "title",
                            "model"
                        ],
                        "-"
                    );

                const type =
                    firstText(
                        cab,
                        [
                            "vehicleType",
                            "cabType",
                            "category",
                            "type",
                            "vehicleCategory",
                            "typeName",
                            "serviceType"
                        ],
                        "-"
                    );

                const capacity =
                    firstText(
                        cab,
                        [
                            "capacity",
                            "seatingCapacity",
                            "seatCapacity",
                            "seating",
                            "maxPax",
                            "pax",
                            "seats"
                        ],
                        "-"
                    );

                const details =
                    firstText(
                        cab,
                        [
                            "details",
                            "description",
                            "remarks",
                            "note",
                            "vehicleDetails",
                            "cabDetails"
                        ],
                        "-"
                    );

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    vehicle
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                type
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                capacity
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                details
                            )}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");
}


// ============================================================
// BUILD ITINERARY
// ============================================================

function buildItineraryHTML(
    itinerary
) {

    if (!itinerary.length) {

        return `
            <div class="empty-box">
                Itinerary details are not available.
            </div>
        `;
    }

    return itinerary
        .map(
            (day, index) => {

                if (
                    typeof day === "string"
                ) {

                    return `
                        <div class="itinerary-day">

                            <div class="day-heading">
                                Day ${index + 1}
                            </div>

                            <div class="day-description">
                                ${renderRichText(day)}
                            </div>

                        </div>
                    `;
                }

                const dayNumber =
                    getValue(
                        day,
                        [
                            "dayNumber",
                            "day",
                            "number",
                            "dayNo"
                        ],
                        index + 1
                    );

                const title =
                    firstText(
                        day,
                        [
                            "title",
                            "heading",
                            "name",
                            "dayTitle",
                            "dayName"
                        ],
                        ""
                    );

                let description =
                    getValue(
                        day,
                        [
                            "description",
                            "details",
                            "content",
                            "itinerary",
                            "dayDescription",
                            "dayPlan"
                        ],
                        ""
                    );

                let bodyHTML =
                    renderRichText(
                        description
                    );

                if (!bodyHTML) {

                    const activities =
                        normalizeArray(
                            getValue(
                                day,
                                [
                                    "activities",
                                    "items",
                                    "points"
                                ],
                                []
                            )
                        );

                    if (
                        activities.length
                    ) {

                        bodyHTML = `
                            <ul>
                                ${activities
                                    .map(
                                        activity =>
                                            `<li>${escapeHtml(
                                                typeof activity === "string"
                                                    ? activity
                                                    : firstText(
                                                        activity,
                                                        [
                                                            "text",
                                                            "title",
                                                            "description",
                                                            "name"
                                                        ],
                                                        ""
                                                    )
                                            )}</li>`
                                    )
                                    .join("")}
                            </ul>
                        `;
                    }
                }

                return `
                    <div class="itinerary-day">

                        <div class="day-heading">

                            Day ${escapeHtml(
                                dayNumber
                            )}

                            ${
                                title
                                    ? `
                                        <span>
                                            — ${escapeHtml(
                                                title
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="day-description">

                            ${
                                bodyHTML
                                    ? bodyHTML
                                    : `<span class="muted">No day details.</span>`
                            }

                        </div>

                    </div>
                `;
            }
        )
        .join("");
}


// ============================================================
// INCLUSIONS / EXCLUSIONS
// ============================================================

function getList(
    quotation,
    paths
) {

    const pkg =
        getQuotationPackage(
            quotation
        );

    let value =
        getValue(
            quotation,
            paths,
            undefined
        );

    if (
        value === undefined &&
        pkg
    ) {

        value =
            getValue(
                pkg,
                [
                    "inclusions",
                    "included",
                    "packageInclusions",
                    "exclusions",
                    "excluded",
                    "packageExclusions"
                ],
                []
            );
    }

    if (
        Array.isArray(value)
    ) {

        return value;
    }

    if (
        typeof value === "string"
    ) {

        return value
            .split(/\r?\n|•/)
            .map(
                item =>
                    item
                        .replace(
                            /^[-*]\s*/,
                            ""
                        )
                        .trim()
            )
            .filter(Boolean);
    }

    return [];
}


// ============================================================
// PRICING
// ============================================================

function getPricing(
    quotation
) {

    // --------------------------------------------------------
    // PACKAGE COST
    // --------------------------------------------------------

    let packageCost =
        getNumber(
            quotation,
            [
                "packageCost",
                "totalPackageCost",
                "package_cost",
                "packageCostValue",
                "packagePrice",
                "baseCost",
                "cost",
                "packageAmount",

                "pricing.packageCost",
                "pricing.totalPackageCost",

                "costing.packageCost",
                "costing.totalPackageCost",

                "amount.packageCost",
                "amount.totalPackageCost",

                "quotationPricing.packageCost",
                "quotationAmount.packageCost"
            ],
            0
        );

    if (!packageCost) {

        packageCost =
            getNumber(
                quotation,
                [
                    "packageCost",
                    "totalPackageCost",
                    "packagePrice",
                    "packageAmount"
                ],
                0
            );
    }


    // --------------------------------------------------------
    // DISCOUNT
    // --------------------------------------------------------

    const discount =
        getNumber(
            quotation,
            [
                "discount",
                "discountAmount",
                "discountValue",

                "pricing.discount",
                "pricing.discountAmount",

                "costing.discount",
                "costing.discountAmount",

                "amount.discount",
                "amount.discountAmount",

                "quotationPricing.discount"
            ],
            0
        );


    // --------------------------------------------------------
    // GST
    // --------------------------------------------------------

    const gst =
        getNumber(
            quotation,
            [
                "gst",
                "gstAmount",
                "gstValue",
                "gstCost",

                "pricing.gst",
                "pricing.gstAmount",
                "pricing.gstValue",

                "costing.gst",
                "costing.gstAmount",

                "amount.gst",
                "amount.gstAmount",

                "quotationPricing.gst"
            ],
            0
        );


    // --------------------------------------------------------
    // GRAND TOTAL
    // --------------------------------------------------------

    const calculatedGrandTotal =
        packageCost -
        discount +
        gst;

    let grandTotal =
        getNumber(
            quotation,
            [
                "grandTotal",
                "totalAmount",
                "total",
                "finalAmount",
                "finalTotal",

                "pricing.grandTotal",
                "pricing.totalAmount",
                "pricing.total",

                "costing.grandTotal",
                "costing.totalAmount",

                "amount.grandTotal",
                "amount.totalAmount",

                "quotationPricing.grandTotal"
            ],
            0
        );

    if (!grandTotal) {

        grandTotal =
            calculatedGrandTotal;
    }


    // --------------------------------------------------------
    // ADULTS
    // --------------------------------------------------------

    const adults =
        getNumber(
            quotation,
            [
                "adults",
                "adultCount",
                "adultPax",
                "pax.adults",
                "travel.adults"
            ],
            0
        );


    // --------------------------------------------------------
    // CHILDREN
    // --------------------------------------------------------

    const children =
        getNumber(
            quotation,
            [
                "children",
                "childCount",
                "childPax",
                "pax.children",
                "travel.children"
            ],
            0
        );


    // --------------------------------------------------------
    // PAX
    // --------------------------------------------------------

    let pax =
        getNumber(
            quotation,
            [
                "pax",
                "totalPax",
                "totalPassengers",
                "passengers",
                "travellers",
                "travelerCount",
                "travel.pax"
            ],
            0
        );

    if (!pax) {

        pax =
            adults +
            children;
    }


    // --------------------------------------------------------
    // PER PERSON
    // --------------------------------------------------------

    let perPerson =
        getNumber(
            quotation,
            [
                "perPerson",
                "perPersonAmount",
                "pricePerPerson",
                "perPersonPrice",

                "pricing.perPerson",
                "pricing.perPersonAmount",

                "costing.perPerson",

                "amount.perPerson",

                "quotationPricing.perPerson"
            ],
            0
        );

    if (!perPerson && pax > 0) {

        perPerson =
            grandTotal /
            pax;
    }


    return {

        packageCost,

        discount,

        gst,

        grandTotal,

        perPerson,

        pax,

        adults,

        children
    };
}


// ============================================================
// PAYMENT DETAILS
// ============================================================

function buildPaymentHTML(
    settings
) {

    const qrCode =
        getQrCode(
            settings
        );

    const hasPayment =
        settings.bankName ||
        settings.accountName ||
        settings.accountNumber ||
        settings.ifsc ||
        settings.upiId ||
        qrCode;

    if (!hasPayment) {

        return `
            <div class="payment-empty">
                Payment details will appear here once configured in Settings.
            </div>
        `;
    }

    return `
        <div class="payment-grid">

            <div class="payment-info">

                ${
                    settings.bankName
                        ? `
                            <div>
                                <strong>Bank:</strong>
                                ${escapeHtml(
                                    settings.bankName
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    settings.accountName
                        ? `
                            <div>
                                <strong>Account Name:</strong>
                                ${escapeHtml(
                                    settings.accountName
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    settings.accountNumber
                        ? `
                            <div>
                                <strong>Account Number:</strong>
                                ${escapeHtml(
                                    settings.accountNumber
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    settings.ifsc
                        ? `
                            <div>
                                <strong>IFSC:</strong>
                                ${escapeHtml(
                                    settings.ifsc
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    settings.upiId
                        ? `
                            <div>
                                <strong>UPI ID:</strong>
                                ${escapeHtml(
                                    settings.upiId
                                )}
                            </div>
                        `
                        : ""
                }

            </div>

            ${
                qrCode
                    ? `
                        <div class="qr-box">

                            <div class="qr-title">
                                Scan & Pay
                            </div>

                            <img
                                src="${escapeHtml(qrCode)}"
                                class="qr-image"
                                alt="Payment QR"
                            >

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


// ============================================================
// BUILD QUOTATION HTML
// ============================================================

function buildQuotationHTML(
    quotation
) {

    const settings =
        getCompanySettings();

    const pkg =
        getQuotationPackage(
            quotation
        );


    // --------------------------------------------------------
    // BASIC DETAILS
    // --------------------------------------------------------

    const quotationId =
        firstText(
            quotation,
            [
                "quotationId",
                "quotationID",
                "id"
            ],
            "-"
        );


    const customer =
        firstText(
            quotation,
            [
                "customerName",
                "customer",
                "customer.name",
                "name"
            ],
            "-"
        );


    const enquiry =
        firstText(
            quotation,
            [
                "enquiryReference",
                "enquiryId",
                "enquiry",
                "enquiry.id",
                "enquiry.reference"
            ],
            "-"
        );


    let packageName =
        firstText(
            quotation,
            [
                "packageName",
                "tourName",
                "package.name",
                "packageNameText"
            ],
            ""
        );


    if (!packageName) {

        const packageValue =
            getValue(
                quotation,
                ["package"],
                ""
            );

        if (
            typeof packageValue ===
            "string"
        ) {

            packageName =
                packageValue;

        } else {

            packageName =
                firstText(
                    pkg,
                    [
                        "name",
                        "packageName",
                        "title"
                    ],
                    "-"
                );
        }
    }


    const destination =
        firstText(
            quotation,
            [
                "destination",
                "destinations",
                "packageDestination",
                "package.destination",
                "destinationName"
            ],
            firstText(
                pkg,
                [
                    "destination",
                    "destinations",
                    "destinationName"
                ],
                "-"
            )
        );


    const startDate =
        getValue(
            quotation,
            [
                "travelStartDate",
                "startDate",
                "travel.startDate",
                "travelDate",
                "dateFrom"
            ],
            ""
        );


    const endDate =
        getValue(
            quotation,
            [
                "travelEndDate",
                "endDate",
                "travel.endDate",
                "dateTo"
            ],
            ""
        );


    const validUntil =
        getValue(
            quotation,
            [
                "validUntil",
                "validityDate",
                "validDate",
                "validity.validUntil"
            ],
            ""
        );


    const rooms =
        getNumber(
            quotation,
            [
                "rooms",
                "roomCount",
                "travel.rooms"
            ],
            0
        );


    // --------------------------------------------------------
    // DATA
    // --------------------------------------------------------

    const pricing =
        getPricing(
            quotation
        );

    const itinerary =
        getItinerary(
            quotation
        );

    const hotels =
        getHotels(
            quotation
        );

    const transport =
        getTransport(
            quotation
        );


    const inclusions =
        getList(
            quotation,
            [
                "inclusions",
                "included",
                "packageInclusions",
                "package.inclusions"
            ]
        );


    const exclusions =
        getList(
            quotation,
            [
                "exclusions",
                "excluded",
                "packageExclusions",
                "package.exclusions"
            ]
        );


    // --------------------------------------------------------
    // TERMS
    // --------------------------------------------------------

    const terms =
        getValue(
            quotation,
            [
                "terms",
                "termsAndConditions",
                "quotationTerms"
            ],
            settings.quotationTerms || ""
        );


    // --------------------------------------------------------
    // COMPANY
    // --------------------------------------------------------

    const logo =
        getLogo(
            settings
        );

    const companyAddress =
        getCompanyAddress(
            settings
        );

    const contactLine =
        getContactLine(
            settings
        );


    // --------------------------------------------------------
    // HTML PARTS
    // --------------------------------------------------------

    const logoHTML =
        logo
            ? `
                <img
                    src="${escapeHtml(logo)}"
                    class="company-logo"
                    alt="Company Logo"
                >
            `
            : `
                <div class="logo-placeholder">
                    My Tour<br>
                    Mitra
                </div>
            `;


    const transportHTML =
        buildTransportHTML(
            transport
        );


    const hotelHTML =
        buildHotelHTML(
            hotels
        );


    const itineraryHTML =
        buildItineraryHTML(
            itinerary
        );


    const paymentHTML =
        buildPaymentHTML(
            settings
        );


    const inclusionHTML =
        inclusions.length
            ? `
                <ul>
                    ${inclusions
                        .map(
                            item =>
                                `<li>${escapeHtml(item)}</li>`
                        )
                        .join("")}
                </ul>
            `
            : `<span class="muted">-</span>`;


    const exclusionHTML =
        exclusions.length
            ? `
                <ul>
                    ${exclusions
                        .map(
                            item =>
                                `<li>${escapeHtml(item)}</li>`
                        )
                        .join("")}
                </ul>
            `
            : `<span class="muted">-</span>`;


    // --------------------------------------------------------
    // PAX TEXT
    // --------------------------------------------------------

    let paxText = "-";

    if (pricing.pax) {

        paxText =
            String(
                pricing.pax
            );

        if (
            pricing.adults ||
            pricing.children
        ) {

            const parts = [];

            if (
                pricing.adults
            ) {

                parts.push(
                    `${pricing.adults} Adult${
                        pricing.adults !== 1
                            ? "s"
                            : ""
                    }`
                );
            }

            if (
                pricing.children
            ) {

                parts.push(
                    `${pricing.children} Child${
                        pricing.children !== 1
                            ? "ren"
                            : ""
                    }`
                );
            }

            paxText +=
                ` (${parts.join(", ")})`;
        }
    }


    // ========================================================
    // FINAL HTML
    // ========================================================

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Quotation ${escapeHtml(quotationId)}
</title>

<style>

/* ==========================================================
   PAGE
========================================================== */

@page {
    size: A4;
    margin: 0;
}

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
    background: #ffffff;
}

body {
    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #1f2937;

    font-size: 10px;

    line-height: 1.45;

    background: #ffffff;
}


/* ==========================================================
   DOCUMENT
========================================================== */

.quotation-document {

    width: 180mm;

    max-width: 180mm;

    margin: 0 auto;

    padding-top: 10mm;

    padding-bottom: 10mm;

    background: #ffffff;
}


/* ==========================================================
   HEADER
========================================================== */

.company-header {

    display: flex;

    justify-content:
        space-between;

    align-items:
        flex-start;

    gap: 12px;

    padding-bottom: 9px;

    border-bottom:
        3px solid #2563eb;

    page-break-inside:
        avoid;
}

.company-left {

    display: flex;

    align-items:
        center;

    gap: 10px;

    min-width: 0;

    flex: 1;
}

.company-logo,
.logo-placeholder {

    width: 62px;

    height: 62px;

    flex: 0 0 62px;
}

.company-logo {

    object-fit:
        contain;
}

.logo-placeholder {

    border:
        2px solid #2563eb;

    border-radius:
        8px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    text-align:
        center;

    font-size:
        9px;

    font-weight:
        800;

    color:
        #2563eb;
}

.company-name {

    font-size:
        19px;

    font-weight:
        800;

    color:
        #111827;
}

.company-tagline {

    font-size:
        9px;

    color:
        #6b7280;

    margin-top:
        1px;
}

.company-address,
.company-contact {

    font-size:
        8px;

    color:
        #4b5563;

    margin-top:
        2px;

    word-break:
        break-word;
}

.quotation-title {

    text-align:
        right;

    min-width:
        145px;

    flex: 0 0 145px;
}

.quotation-title h1 {

    margin:
        0;

    color:
        #2563eb;

    font-size:
        22px;

    letter-spacing:
        1px;
}

.quotation-meta {

    font-size:
        8px;

    color:
        #374151;

    margin-top:
        3px;
}


/* ==========================================================
   SECTIONS
========================================================== */

.section {

    margin-top:
        9px;
}

.section-title {

    padding:
        5px 8px;

    margin-bottom:
        5px;

    background:
        #eff6ff;

    border-left:
        4px solid #2563eb;

    color:
        #1d4ed8;

    font-size:
        10.5px;

    font-weight:
        800;

    page-break-after:
        avoid;
}

.section-subtitle {

    font-size:
        8px;

    color:
        #6b7280;

    margin:
        0 0 5px;
}


/* ==========================================================
   TABLES
========================================================== */

table {

    width:
        100%;

    border-collapse:
        collapse;
}

td,
th {

    word-break:
        break-word;

    overflow-wrap:
        anywhere;
}


/* ==========================================================
   CUSTOMER TABLE
========================================================== */

.details-table {

    table-layout:
        fixed;
}

.details-table td {

    border:
        1px solid #dbe2ea;

    padding:
        5px 6px;

    vertical-align:
        top;
}

.details-label {

    width:
        15%;

    background:
        #f8fafc;

    font-weight:
        700;

    color:
        #4b5563;
}

.details-value {

    width:
        35%;

    color:
        #111827;
}


/* ==========================================================
   NORMAL TABLE
========================================================== */

.data-table {

    table-layout:
        fixed;
}

.data-table th {

    background:
        #2563eb;

    color:
        #ffffff;

    text-align:
        left;

    padding:
        5px 6px;

    font-size:
        8px;

    font-weight:
        700;
}

.data-table td {

    border:
        1px solid #dbe2ea;

    padding:
        5px 6px;

    vertical-align:
        top;
}

.data-table tr {

    page-break-inside:
        avoid;
}


/* ==========================================================
   TRANSPORT WIDTHS
========================================================== */

.transport-table th:nth-child(1),
.transport-table td:nth-child(1) {

    width:
        25%;
}

.transport-table th:nth-child(2),
.transport-table td:nth-child(2) {

    width:
        20%;
}

.transport-table th:nth-child(3),
.transport-table td:nth-child(3) {

    width:
        15%;
}

.transport-table th:nth-child(4),
.transport-table td:nth-child(4) {

    width:
        40%;
}


/* ==========================================================
   HOTEL WIDTHS
========================================================== */

.hotel-table th:nth-child(1),
.hotel-table td:nth-child(1) {

    width:
        22%;
}

.hotel-table th:nth-child(2),
.hotel-table td:nth-child(2) {

    width:
        40%;
}

.hotel-table th:nth-child(3),
.hotel-table td:nth-child(3) {

    width:
        18%;
}

.hotel-table th:nth-child(4),
.hotel-table td:nth-child(4) {

    width:
        20%;
}


/* ==========================================================
   EMPTY / MUTED
========================================================== */

.muted {

    color:
        #6b7280;
}

.empty-box {

    border:
        1px dashed #cbd5e1;

    padding:
        8px;

    color:
        #6b7280;
}


/* ==========================================================
   ITINERARY
========================================================== */

.itinerary-day {

    border:
        1px solid #dbe2ea;

    border-radius:
        6px;

    padding:
        7px 9px;

    margin-bottom:
        7px;

    background:
        #ffffff;

    page-break-inside:
        avoid;
}

.day-heading {

    color:
        #1d4ed8;

    font-size:
        10px;

    font-weight:
        800;

    margin-bottom:
        4px;
}

.day-heading span {

    color:
        #111827;
}

.day-description {

    color:
        #374151;

    font-size:
        9px;
}

.day-description p {

    margin:
        2px 0 4px;
}

.day-description ul,
.day-description ol {

    margin:
        3px 0 4px 17px;

    padding:
        0;
}

.day-description li {

    margin-bottom:
        2px;
}

.day-description strong {

    color:
        #111827;
}


/* ==========================================================
   INCLUSIONS / EXCLUSIONS
========================================================== */

.list-columns {

    display:
        flex;

    gap:
        8px;

    width:
        100%;
}

.list-column {

    flex:
        1;

    min-width:
        0;

    border:
        1px solid #dbe2ea;

    border-radius:
        6px;

    padding:
        7px 9px;

    page-break-inside:
        avoid;
}

.list-column h4 {

    margin:
        0 0 4px;

    color:
        #1d4ed8;

    font-size:
        9px;
}

.list-column ul {

    margin:
        2px 0 0 16px;

    padding:
        0;
}

.list-column li {

    margin-bottom:
        2px;

    font-size:
        8.5px;
}


/* ==========================================================
   PRICING
========================================================== */

.pricing-table {

    table-layout:
        fixed;
}

.pricing-table td {

    border:
        1px solid #d1d5db;

    padding:
        7px 8px;
}

.pricing-label {

    width:
        68%;

    color:
        #374151;
}

.pricing-value {

    width:
        32%;

    text-align:
        right;

    font-weight:
        700;

    white-space:
        nowrap;
}

.grand-total td {

    background:
        #eff6ff;

    color:
        #1d4ed8;

    font-size:
        11px;

    font-weight:
        800;
}

.per-person td {

    background:
        #f8fafc;

    font-weight:
        800;
}


/* ==========================================================
   PAYMENT
========================================================== */

.payment-box {

    border:
        1px solid #dbe2ea;

    border-radius:
        6px;

    padding:
        9px;

    page-break-inside:
        avoid;
}

.payment-grid {

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        flex-start;

    gap:
        20px;
}

.payment-info {

    line-height:
        1.8;

    font-size:
        9px;

    flex:
        1;
}

.qr-box {

    text-align:
        center;

    width:
        100px;

    flex:
        0 0 100px;

    font-size:
        8px;

    font-weight:
        800;

    color:
        #374151;
}

.qr-title {

    margin-bottom:
        3px;
}

.qr-image {

    width:
        88px;

    height:
        88px;

    object-fit:
        contain;
}

.payment-empty {

    color:
        #6b7280;

    font-size:
        8.5px;
}


/* ==========================================================
   TERMS
========================================================== */

.terms-box {

    border:
        1px solid #e5e7eb;

    border-radius:
        6px;

    padding:
        7px 9px;

    font-size:
        8px;

    color:
        #4b5563;

    page-break-inside:
        avoid;
}

.terms-box p {

    margin:
        2px 0 4px;
}

.terms-box ul,
.terms-box ol {

    margin:
        2px 0 4px 16px;
}


/* ==========================================================
   FOOTER
========================================================== */

.document-footer {

    margin-top:
        10px;

    padding-top:
        6px;

    border-top:
        1px solid #dbe2ea;

    text-align:
        center;

    font-size:
        7.5px;

    color:
        #6b7280;

    page-break-inside:
        avoid;
}


/* ==========================================================
   PAGE BREAK CONTROL
========================================================== */

.keep-together {

    page-break-inside:
        avoid;
}

</style>

</head>

<body>

<div class="quotation-document">


<!-- ========================================================
     COMPANY HEADER
======================================================== -->

<div class="company-header">

    <div class="company-left">

        ${logoHTML}

        <div>

            <div class="company-name">
                ${escapeHtml(
                    settings.companyName ||
                    "My Tour Mitra"
                )}
            </div>

            ${
                settings.tagline
                    ? `
                        <div class="company-tagline">
                            ${escapeHtml(
                                settings.tagline
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                companyAddress
                    ? `
                        <div class="company-address">
                            ${escapeHtml(
                                companyAddress
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                contactLine
                    ? `
                        <div class="company-contact">
                            ${escapeHtml(
                                contactLine
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                settings.gstNumber
                    ? `
                        <div class="company-contact">
                            <strong>GSTIN:</strong>
                            ${escapeHtml(
                                settings.gstNumber
                            )}
                        </div>
                    `
                    : ""
            }

        </div>

    </div>


    <div class="quotation-title">

        <h1>
            QUOTATION
        </h1>

        <div class="quotation-meta">
            <strong>
                Quotation ID:
            </strong>
            ${escapeHtml(
                quotationId
            )}
        </div>

        <div class="quotation-meta">
            <strong>
                Date:
            </strong>
            ${formatDate(
                new Date()
                    .toISOString()
                    .slice(0, 10)
            )}
        </div>

    </div>

</div>


<!-- ========================================================
     CUSTOMER DETAILS
======================================================== -->

<div class="section">

    <div class="section-title">
        Customer & Tour Details
    </div>

    <table class="details-table">

        <tr>

            <td class="details-label">
                Customer
            </td>

            <td class="details-value">
                ${escapeHtml(
                    customer
                )}
            </td>

            <td class="details-label">
                Enquiry
            </td>

            <td class="details-value">
                ${escapeHtml(
                    enquiry
                )}
            </td>

        </tr>


        <tr>

            <td class="details-label">
                Package
            </td>

            <td class="details-value">

                <strong>
                    ${escapeHtml(
                        packageName
                    )}
                </strong>

            </td>

            <td class="details-label">
                Destination
            </td>

            <td class="details-value">
                ${escapeHtml(
                    destination
                )}
            </td>

        </tr>


        <tr>

            <td class="details-label">
                Travel Date
            </td>

            <td class="details-value">

                ${formatDate(
                    startDate
                )}

                ${
                    endDate
                        ? `
                            &nbsp;–&nbsp;
                            ${formatDate(
                                endDate
                            )}
                        `
                        : ""
                }

            </td>

            <td class="details-label">
                Pax
            </td>

            <td class="details-value">
                ${escapeHtml(
                    paxText
                )}
            </td>

        </tr>


        <tr>

            <td class="details-label">
                Rooms
            </td>

            <td class="details-value">
                ${
                    rooms || "-"
                }
            </td>

            <td class="details-label">
                Valid Until
            </td>

            <td class="details-value">
                ${formatDate(
                    validUntil
                )}
            </td>

        </tr>

    </table>

</div>


<!-- ========================================================
     TRANSPORTATION
======================================================== -->

<div class="section">

    <div class="section-title">
        Transportation
    </div>

    <table class="data-table transport-table">

        <thead>

            <tr>

                <th>
                    Vehicle
                </th>

                <th>
                    Type
                </th>

                <th>
                    Capacity
                </th>

                <th>
                    Details
                </th>

            </tr>

        </thead>

        <tbody>

            ${transportHTML}

        </tbody>

    </table>

</div>


<!-- ========================================================
     HOTEL DETAILS
======================================================== -->

<div class="section">

    <div class="section-title">
        Hotel Details
    </div>

    <table class="data-table hotel-table">

        <thead>

            <tr>

                <th>
                    Destination
                </th>

                <th>
                    Hotel
                </th>

                <th>
                    Room
                </th>

                <th>
                    Meal Plan
                </th>

            </tr>

        </thead>

        <tbody>

            ${hotelHTML}

        </tbody>

    </table>

</div>


<!-- ========================================================
     ITINERARY
======================================================== -->

<div class="section">

    <div class="section-title">
        Tour Itinerary
    </div>

    <div class="section-subtitle">
        Day-wise tour plan from Package Master
    </div>

    ${itineraryHTML}

</div>


<!-- ========================================================
     INCLUSIONS / EXCLUSIONS
======================================================== -->

${
    inclusions.length ||
    exclusions.length
        ? `

            <div class="section keep-together">

                <div class="section-title">
                    Package Inclusions & Exclusions
                </div>

                <div class="list-columns">

                    <div class="list-column">

                        <h4>
                            Inclusions
                        </h4>

                        ${inclusionHTML}

                    </div>


                    <div class="list-column">

                        <h4>
                            Exclusions
                        </h4>

                        ${exclusionHTML}

                    </div>

                </div>

            </div>

        `
        : ""
}


<!-- ========================================================
     PRICING
======================================================== -->

<div class="section keep-together">

    <div class="section-title">
        Quotation Summary
    </div>

    <table class="pricing-table">

        <tr>

            <td class="pricing-label">
                Package Cost
            </td>

            <td class="pricing-value">
                ${formatCurrency(
                    pricing.packageCost
                )}
            </td>

        </tr>


        <tr>

            <td class="pricing-label">
                Discount
            </td>

            <td class="pricing-value">
                ${formatCurrency(
                    pricing.discount
                )}
            </td>

        </tr>


        <tr>

            <td class="pricing-label">
                GST
            </td>

            <td class="pricing-value">
                ${formatCurrency(
                    pricing.gst
                )}
            </td>

        </tr>


        <tr class="grand-total">

            <td>
                GRAND TOTAL
            </td>

            <td class="pricing-value">
                ${formatCurrency(
                    pricing.grandTotal
                )}
            </td>

        </tr>


        <tr class="per-person">

            <td>
                Total Package Cost / Per Person
            </td>

            <td class="pricing-value">
                ${formatCurrency(
                    pricing.perPerson
                )}
            </td>

        </tr>

    </table>

</div>


<!-- ========================================================
     PAYMENT
======================================================== -->

<div class="section">

    <div class="section-title">
        Payment Details
    </div>

    <div class="payment-box">

        ${paymentHTML}

    </div>

</div>


<!-- ========================================================
     TERMS
======================================================== -->

<div class="section">

    <div class="section-title">
        Terms & Conditions
    </div>

    <div class="terms-box">

        ${
            terms
                ? renderRichText(
                    terms
                )
                : `
                    <p>
                        Package is subject to availability.
                        Hotel and transportation are subject to confirmation.
                    </p>

                    <p>
                        Final booking is confirmed only after receipt
                        of the required advance payment.
                    </p>
                `
        }

    </div>

</div>


<!-- ========================================================
     FOOTER
======================================================== -->

<div class="document-footer">

    ${
        settings.quotationFooter
            ? renderRichText(
                settings.quotationFooter
            )
            : `
                Thank you for choosing
                ${escapeHtml(
                    settings.companyName ||
                    "My Tour Mitra"
                )}.
            `
    }

    ${
        settings.panNumber
            ? `
                <div>
                    PAN:
                    ${escapeHtml(
                        settings.panNumber
                    )}
                </div>
            `
            : ""
    }

</div>


</div>

</body>

</html>
`;
}


// ============================================================
// LOAD HTML2PDF
// ============================================================

function loadHtml2Pdf() {

    return new Promise(
        (resolve, reject) => {

            if (
                typeof window.html2pdf ===
                "function"
            ) {

                resolve(
                    window.html2pdf
                );

                return;
            }


            const existing =
                document.querySelector(
                    'script[data-mytourmitra-html2pdf="true"]'
                );


            if (existing) {

                existing.addEventListener(
                    "load",
                    () => {

                        if (
                            typeof window.html2pdf ===
                            "function"
                        ) {

                            resolve(
                                window.html2pdf
                            );

                        } else {

                            reject(
                                new Error(
                                    "html2pdf unavailable."
                                )
                            );
                        }

                    },
                    {
                        once: true
                    }
                );

                existing.addEventListener(
                    "error",
                    () => {

                        reject(
                            new Error(
                                "Could not load html2pdf."
                            )
                        );

                    },
                    {
                        once: true
                    }
                );

                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

            script.async =
                true;

            script.dataset.mytourmitraHtml2pdf =
                "true";


            script.onload =
                () => {

                    if (
                        typeof window.html2pdf ===
                        "function"
                    ) {

                        resolve(
                            window.html2pdf
                        );

                    } else {

                        reject(
                            new Error(
                                "PDF library unavailable."
                            )
                        );
                    }
                };


            script.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to load PDF library."
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


// ============================================================
// PDF CONTAINER
// ============================================================

function createPdfContainer(
    html
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.innerHTML =
        html;


    wrapper.style.position =
        "absolute";

    wrapper.style.left =
        "0";

    wrapper.style.top =
        "0";

    wrapper.style.width =
        "180mm";

    wrapper.style.maxWidth =
        "180mm";

    wrapper.style.background =
        "#ffffff";

    wrapper.style.zIndex =
        "-999999";


    document.body.appendChild(
        wrapper
    );


    return wrapper;
}


// ============================================================
// PDF FILENAME
// ============================================================

function getPdfFilename(
    quotation
) {

    const quotationId =
        firstText(
            quotation,
            [
                "quotationId",
                "quotationID",
                "id"
            ],
            "Quotation"
        );


    const customer =
        firstText(
            quotation,
            [
                "customerName",
                "customer",
                "name"
            ],
            "Customer"
        );


    const safeCustomer =
        String(customer)
            .replace(
                /[^a-z0-9]+/gi,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    return `
        My-Tour-Mitra-Quotation-
        ${quotationId}-
        ${safeCustomer || "Customer"}.pdf
    `
        .replace(
            /\s+/g,
            ""
        );
}


// ============================================================
// PDF OPTIONS
// ============================================================

function getPdfOptions(
    filename
) {

    return {

        margin: 0,

        filename,

        image: {

            type:
                "jpeg",

            quality:
                0.98
        },


        html2canvas: {

            scale:
                2,

            useCORS:
                true,

            allowTaint:
                true,

            backgroundColor:
                "#ffffff",

            logging:
                false,

            scrollX:
                0,

            scrollY:
                0
        },


        jsPDF: {

            unit:
                "mm",

            format:
                "a4",

            orientation:
                "portrait",

            compress:
                true
        },


        pagebreak: {

            mode: [
                "css",
                "legacy"
            ],

            avoid: [
                ".itinerary-day",
                ".data-table tr",
                ".payment-box",
                ".list-column",
                ".terms-box",
                ".keep-together"
            ]
        }
    };
}


// ============================================================
// DOWNLOAD PDF
// ============================================================

async function generateQuotationPDF(
    quotation
) {

    if (!quotation) {

        alert(
            "Quotation data not found."
        );

        return;
    }


    let container =
        null;


    try {

        const html2pdf =
            await loadHtml2Pdf();


        const html =
            buildQuotationHTML(
                quotation
            );


        container =
            createPdfContainer(
                html
            );


        const element =
            container.querySelector(
                ".quotation-document"
            );


        if (!element) {

            throw new Error(
                "Quotation document not found."
            );
        }


        // Allow browser to finish rendering
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    150
                )
        );


        const filename =
            getPdfFilename(
                quotation
            );


        const options =
            getPdfOptions(
                filename
            );


        await html2pdf()
            .set(options)
            .from(element)
            .save();


    } catch (error) {

        console.error(
            "Quotation PDF error:",
            error
        );

        alert(
            "Could not generate quotation PDF. Please check browser console."
        );

    } finally {

        if (
            container
        ) {

            container.remove();
        }
    }
}


// ============================================================
// SHARE PDF
// ============================================================

async function shareQuotationPDF(
    quotation
) {

    if (!quotation) {

        alert(
            "Quotation data not found."
        );

        return;
    }


    let container =
        null;


    try {

        const html2pdf =
            await loadHtml2Pdf();


        const html =
            buildQuotationHTML(
                quotation
            );


        container =
            createPdfContainer(
                html
            );


        const element =
            container.querySelector(
                ".quotation-document"
            );


        if (!element) {

            throw new Error(
                "Quotation document not found."
            );
        }


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    150
                )
        );


        const filename =
            getPdfFilename(
                quotation
            );


        const options =
            getPdfOptions(
                filename
            );


        const worker =
            html2pdf()
                .set(options)
                .from(element);


        const pdfBlob =
            await worker.output(
                "blob"
            );


        // ----------------------------------------------------
        // MOBILE / FILE SHARE
        // ----------------------------------------------------

        if (
            navigator.share &&
            navigator.canShare
        ) {

            const file =
                new File(
                    [
                        pdfBlob
                    ],
                    filename,
                    {
                        type:
                            "application/pdf"
                    }
                );


            if (
                navigator.canShare(
                    {
                        files:
                            [file]
                    }
                )
            ) {

                await navigator.share(
                    {

                        title:
                            `Quotation ${
                                firstText(
                                    quotation,
                                    [
                                        "quotationId",
                                        "id"
                                    ],
                                    ""
                                )
                            }`,

                        text:
                            "Quotation from My Tour Mitra",

                        files:
                            [file]
                    }
                );


                return;
            }
        }


        // ----------------------------------------------------
        // DESKTOP FALLBACK
        // ----------------------------------------------------

        const url =
            URL.createObjectURL(
                pdfBlob
            );


        const anchor =
            document.createElement(
                "a"
            );


        anchor.href =
            url;

        anchor.download =
            filename;


        document.body.appendChild(
            anchor
        );


        anchor.click();


        anchor.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            3000
        );


        // ----------------------------------------------------
        // WHATSAPP MESSAGE
        // ----------------------------------------------------

        const settings =
            getCompanySettings();


        const phone =
            settings.whatsapp ||
            settings.phone ||
            "";


        const customer =
            firstText(
                quotation,
                [
                    "customerName",
                    "customer",
                    "name"
                ],
                "Customer"
            );


        const quotationId =
            firstText(
                quotation,
                [
                    "quotationId",
                    "id"
                ],
                "Quotation"
            );


        if (phone) {

            const message =
                encodeURIComponent(
                    `Hello ${customer},

Please find your quotation ${quotationId} from My Tour Mitra.

Thank you.`
                );


            const whatsappUrl =
                `https://wa.me/${
                    String(phone)
                        .replace(
                            /\D/g,
                            ""
                        )
                }?text=${message}`;


            window.open(
                whatsappUrl,
                "_blank"
            );
        }


    } catch (error) {

        console.error(
            "Quotation sharing error:",
            error
        );

        alert(
            "Could not prepare quotation for sharing."
        );

    } finally {

        if (
            container
        ) {

            container.remove();
        }
    }
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.generateQuotationPDF =
    generateQuotationPDF;

window.shareQuotationPDF =
    shareQuotationPDF;

window.buildQuotationHTML =
    buildQuotationHTML;

window.getCompanySettings =
    getCompanySettings;


// ============================================================
// EXPORTS
// ============================================================

export {

    generateQuotationPDF,

    shareQuotationPDF,

    buildQuotationHTML,

    getCompanySettings

};

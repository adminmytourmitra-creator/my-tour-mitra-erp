/* =========================================================
   MY TOUR MITRA ERP
   PACKAGE MASTER MODULE
   File: modules/packages/packages.js
   ========================================================= */

(function () {
    "use strict";

    let packages = [];
    let editingPackageId = null;
    let deletingPackageId = null;
    let initialized = false;

    /* =====================================================
       HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function getDB() {
        return (
            window.db ||
            window.firebaseDB ||
            window.firebaseDb ||
            window.firestoreDB ||
            null
        );
    }

    function firebaseFunction(name) {
        return window[name] || null;
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function setValue(id, value) {
        const element = $(id);

        if (element) {
            element.value = value ?? "";
        }
    }

    function getValue(id) {
        const element = $(id);

        return element ? element.value.trim() : "";
    }

    function getNumber(id) {
        const value = getValue(id);

        if (value === "") return 0;

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    }

    function getChecked(id) {
        const element = $(id);

        return element ? element.checked : false;
    }

    function setChecked(id, value) {
        const element = $(id);

        if (element) {
            element.checked = Boolean(value);
        }
    }

    function show(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }

    function hide(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }

    /* =====================================================
       FIREBASE
       ===================================================== */

    async function getCollectionData(collectionName) {

        const db = getDB();

        const collectionFn =
            firebaseFunction("collection");

        const getDocsFn =
            firebaseFunction("getDocs");

        if (!db || !collectionFn || !getDocsFn) {
            throw new Error(
                "Firebase Firestore is not available."
            );
        }

        const snapshot = await getDocsFn(
            collectionFn(db, collectionName)
        );

        const result = [];

        snapshot.forEach(function (docSnapshot) {

            result.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });

        });

        return result;
    }

    /* =====================================================
       PACKAGE ID
       ===================================================== */

    function generatePackageId() {

        let highest = 0;

        packages.forEach(function (item) {

            const id =
                item.packageCode ||
                item.packageId ||
                item.displayId ||
                item.id ||
                "";

            const match =
                String(id).match(/(\d+)$/);

            if (match) {

                const number =
                    parseInt(match[1], 10);

                if (number > highest) {
                    highest = number;
                }
            }
        });

        return (
            "PKG" +
            String(highest + 1).padStart(6, "0")
        );
    }

    /* =====================================================
       LOAD PACKAGES
       ===================================================== */

    async function loadPackages() {

        showLoading();

        try {

            packages =
                await getCollectionData(
                    "packages"
                );

            renderPackages();
            updateSummary();

        } catch (error) {

            console.error(
                "Error loading packages:",
                error
            );

            packages = [];

            renderPackages();
            updateSummary();

            showError(
                "Unable to load packages."
            );

        } finally {

            hideLoading();

        }
    }

    /* =====================================================
       RENDER PACKAGE TABLE
       ===================================================== */

    function renderPackages() {

        const tbody =
            $("packages-table-body");

        if (!tbody) return;

        const search =
            normalize(
                getValue("package-search")
            );

        const statusFilter =
            getValue("package-status-filter") ||
            "all";

        const categoryFilter =
            getValue("package-category-filter") ||
            "all";

        const filtered =
            packages.filter(function (item) {

                const packageId =
                    item.packageCode ||
                    item.packageId ||
                    item.displayId ||
                    item.id ||
                    "";

                const packageName =
                    item.packageName ||
                    item.name ||
                    "";

                const destination =
                    item.destination ||
                    "";

                const category =
                    item.category ||
                    "";

                const searchText =
                    [
                        packageId,
                        packageName,
                        destination,
                        category,
                        item.destinationsCovered
                    ].join(" ");

                if (
                    search &&
                    !normalize(searchText)
                        .includes(search)
                ) {
                    return false;
                }

                if (
                    statusFilter !== "all" &&
                    normalize(
                        item.status || "Active"
                    ) !== normalize(statusFilter)
                ) {
                    return false;
                }

                if (
                    categoryFilter !== "all" &&
                    normalize(
                        category
                    ) !== normalize(categoryFilter)
                ) {
                    return false;
                }

                return true;
            });

        const count =
            $("package-record-count");

        if (count) {

            count.textContent =
                `${filtered.length} record${
                    filtered.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="9"
                        class="table-empty">

                        <div class="nested-empty-state">

                            <div class="empty-icon">
                                📦
                            </div>

                            <strong>
                                No packages found
                            </strong>

                            <p>
                                Create your first package
                                using "New Package".
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            filtered.map(
                renderPackageRow
            ).join("");
    }

    function renderPackageRow(item) {

        const packageId =
            item.packageCode ||
            item.packageId ||
            item.displayId ||
            item.id ||
            "-";

        const name =
            item.packageName ||
            item.name ||
            "-";

        const destination =
            item.destination ||
            "-";

        const category =
            item.category ||
            "-";

        const nights =
            Number(item.nights || 0);

        const days =
            Number(item.days || 0);

        let duration = "-";

        if (nights || days) {

            duration =
                `${nights}N / ${days}D`;

        }

        const price =
            Number(item.price || 0);

        const formattedPrice =
            price
                ? `₹${price.toLocaleString("en-IN")}`
                : "-";

        const status =
            item.status ||
            "Active";

        const featured =
            item.featured === true;

        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHTML(packageId)}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(destination)}
                </td>

                <td>
                    ${escapeHTML(duration)}
                </td>

                <td>
                    ${escapeHTML(category)}
                </td>

                <td>
                    ${formattedPrice}
                </td>

                <td>

                    <span
                        class="package-status-badge status-${normalize(status)}"
                    >
                        ${escapeHTML(status)}
                    </span>

                </td>

                <td>

                    ${
                        featured
                            ? `<span class="package-featured-badge">★ Featured</span>`
                            : `<span>-</span>`
                    }

                </td>

                <td>

                    <div class="package-action-buttons">

                        <button
                            type="button"
                            class="package-action-btn edit"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="package-action-btn delete"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            </tr>
        `;
    }

    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary() {

        const total =
            packages.length;

        const active =
            packages.filter(function (item) {

                return normalize(
                    item.status || "Active"
                ) === "active";

            }).length;

        const destinations =
            new Set(
                packages
                    .map(function (item) {
                        return normalize(
                            item.destination
                        );
                    })
                    .filter(Boolean)
            ).size;

        const featured =
            packages.filter(function (item) {
                return item.featured === true;
            }).length;

        setText(
            "package-total-count",
            total
        );

        setText(
            "package-active-count",
            active
        );

        setText(
            "package-destination-count",
            destinations
        );

        setText(
            "package-featured-count",
            featured
        );
    }

    function setText(id, value) {

        const element = $(id);

        if (element) {
            element.textContent = value;
        }
    }

    /* =====================================================
       NEW PACKAGE
       ===================================================== */

    function openNewPackage() {

        editingPackageId = null;

        const form =
            $("package-form");

        if (form) {
            form.reset();
        }

        setValue(
            "package-display-id",
            generatePackageId()
        );

        setValue(
            "package-status",
            "Active"
        );

        setValue(
            "package-price-type",
            "Per Person"
        );

        setValue(
            "package-currency",
            "INR"
        );

        setValue(
            "package-nights",
            ""
        );

        setValue(
            "package-days",
            ""
        );

        clearItinerary();
        clearHotels();
        clearCabs();

        const title =
            $("package-form-title");

        if (title) {
            title.textContent =
                "New Package";
        }

        const saveButton =
            $("package-save-btn");

        if (saveButton) {
            saveButton.textContent =
                "Save Package";
        }

        show(
            $("package-form-card")
        );

        hide(
            $("packages-list-card")
        );

        const formCard =
            $("package-form-card");

        if (formCard) {

            formCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    }

    /* =====================================================
       EDIT PACKAGE
       ===================================================== */

    function editPackage(id) {

        const item =
            packages.find(function (pkg) {
                return pkg.id === id;
            });

        if (!item) {
            showError(
                "Package not found."
            );
            return;
        }

        editingPackageId =
            item.id;

        /* BASIC DETAILS */

        setValue(
            "package-id",
            item.id
        );

        setValue(
            "package-display-id",
            item.packageCode ||
            item.packageId ||
            item.displayId ||
            ""
        );

        setValue(
            "package-name",
            item.packageName ||
            item.name ||
            ""
        );

        setValue(
            "package-status",
            item.status ||
            "Active"
        );

        setValue(
            "package-category",
            item.category ||
            ""
        );

        setValue(
            "package-type",
            item.packageType ||
            ""
        );

        setValue(
            "package-nights",
            item.nights ||
            ""
        );

        setValue(
            "package-days",
            item.days ||
            ""
        );

        setValue(
            "package-destination",
            item.destination ||
            ""
        );

        setValue(
            "package-destinations",
            item.destinationsCovered ||
            ""
        );

        setValue(
            "package-start-location",
            item.startLocation ||
            ""
        );

        setValue(
            "package-end-location",
            item.endLocation ||
            ""
        );

        setValue(
            "package-short-description",
            item.shortDescription ||
            ""
        );

        setChecked(
            "package-featured",
            item.featured
        );

        /* PRICING */

        setValue(
            "package-price-type",
            item.priceType ||
            "Per Person"
        );

        setValue(
            "package-price",
            item.price ||
            ""
        );

        setValue(
            "package-currency",
            item.currency ||
            "INR"
        );

        setValue(
            "package-min-pax",
            item.minimumPax ||
            ""
        );

        setValue(
            "package-max-pax",
            item.maximumPax ||
            ""
        );

        setValue(
            "package-pricing-notes",
            item.pricingNotes ||
            ""
        );

        /* OTHER */

        setValue(
            "package-inclusions",
            item.inclusions ||
            ""
        );

        setValue(
            "package-exclusions",
            item.exclusions ||
            ""
        );

        setValue(
            "package-terms",
            item.terms ||
            ""
        );

        setValue(
            "package-internal-notes",
            item.internalNotes ||
            ""
        );

        /* NESTED DATA */

        renderItinerary(
            Array.isArray(item.itinerary)
                ? item.itinerary
                : []
        );

        renderHotels(
            Array.isArray(item.hotels)
                ? item.hotels
                : []
        );

        renderCabs(
            Array.isArray(item.cabs)
                ? item.cabs
                : []
        );

        const title =
            $("package-form-title");

        if (title) {
            title.textContent =
                "Edit Package";
        }

        const saveButton =
            $("package-save-btn");

        if (saveButton) {
            saveButton.textContent =
                "Update Package";
        }

        show(
            $("package-form-card")
        );

        hide(
            $("packages-list-card")
        );

        const formCard =
            $("package-form-card");

        if (formCard) {

            formCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    /* =====================================================
       ITINERARY
       ===================================================== */

    function addItineraryDay(data = null) {

        const container =
            $("itinerary-container");

        const template =
            $("itinerary-day-template");

        if (!container || !template) {
            return;
        }

        hide(
            $("itinerary-empty")
        );

        const clone =
            template.content.cloneNode(true);

        const card =
            clone.querySelector(
                ".itinerary-day-card"
            );

        if (!card) {
            return;
        }

        const existingCards =
            container.querySelectorAll(
                ".itinerary-day-card"
            );

        const index =
            existingCards.length + 1;

        card.dataset.itineraryIndex =
            index;

        const dayNumber =
            card.querySelector(
                ".itinerary-day-number"
            );

        const dayLabel =
            card.querySelector(
                ".day-number"
            );

        if (dayNumber) {

            dayNumber.value =
                data?.day ||
                index;
        }

        if (dayLabel) {

            dayLabel.textContent =
                `Day ${data?.day || index}`;
        }

        setInputValue(
            card,
            ".itinerary-day-title",
            data?.title ||
            ""
        );

        setInputValue(
            card,
            ".itinerary-route",
            data?.route ||
            ""
        );

        setInputValue(
            card,
            ".itinerary-overnight",
            data?.overnight ||
            ""
        );

        setInputValue(
            card,
            ".itinerary-sightseeing",
            data?.sightseeing ||
            data?.activities ||
            ""
        );

        setInputValue(
            card,
            ".itinerary-notes",
            data?.notes ||
            ""
        );

        setCheckedInside(
            card,
            ".itinerary-breakfast",
            data?.meals?.breakfast
        );

        setCheckedInside(
            card,
            ".itinerary-lunch",
            data?.meals?.lunch
        );

        setCheckedInside(
            card,
            ".itinerary-dinner",
            data?.meals?.dinner
        );

        container.appendChild(card);

        updateItineraryDayNumbers();
    }

    function setInputValue(
        parent,
        selector,
        value
    ) {

        const element =
            parent.querySelector(selector);

        if (element) {
            element.value =
                value ?? "";
        }
    }

    function setCheckedInside(
        parent,
        selector,
        value
    ) {

        const element =
            parent.querySelector(selector);

        if (element) {
            element.checked =
                Boolean(value);
        }
    }

    function updateItineraryDayNumbers() {

        const cards =
            document.querySelectorAll(
                "#itinerary-container .itinerary-day-card"
            );

        cards.forEach(
            function (card, index) {

                const number =
                    index + 1;

                const dayInput =
                    card.querySelector(
                        ".itinerary-day-number"
                    );

                const label =
                    card.querySelector(
                        ".day-number"
                    );

                if (dayInput) {
                    dayInput.value =
                        number;
                }

                if (label) {
                    label.textContent =
                        `Day ${number}`;
                }

                card.dataset.itineraryIndex =
                    number;
            }
        );
    }

    function collectItinerary() {

        const cards =
            document.querySelectorAll(
                "#itinerary-container .itinerary-day-card"
            );

        return Array.from(cards)
            .map(function (card, index) {

                return {

                    day:
                        Number(
                            card.querySelector(
                                ".itinerary-day-number"
                            )?.value
                        ) ||
                        index + 1,

                    title:
                        card.querySelector(
                            ".itinerary-day-title"
                        )?.value.trim() ||
                        "",

                    route:
                        card.querySelector(
                            ".itinerary-route"
                        )?.value.trim() ||
                        "",

                    overnight:
                        card.querySelector(
                            ".itinerary-overnight"
                        )?.value.trim() ||
                        "",

                    sightseeing:
                        card.querySelector(
                            ".itinerary-sightseeing"
                        )?.value.trim() ||
                        "",

                    meals: {

                        breakfast:
                            card.querySelector(
                                ".itinerary-breakfast"
                            )?.checked ||
                            false,

                        lunch:
                            card.querySelector(
                                ".itinerary-lunch"
                            )?.checked ||
                            false,

                        dinner:
                            card.querySelector(
                                ".itinerary-dinner"
                            )?.checked ||
                            false
                    },

                    notes:
                        card.querySelector(
                            ".itinerary-notes"
                        )?.value.trim() ||
                        ""
                };
            });
    }

    function renderItinerary(items) {

        const container =
            $("itinerary-container");

        if (!container) return;

        container
            .querySelectorAll(
                ".itinerary-day-card"
            )
            .forEach(function (element) {
                element.remove();
            });

        if (!items.length) {

            show(
                $("itinerary-empty")
            );

            return;
        }

        hide(
            $("itinerary-empty")
        );

        items.forEach(function (item) {

            addItineraryDay(item);

        });
    }

    function clearItinerary() {

        const container =
            $("itinerary-container");

        if (!container) return;

        container
            .querySelectorAll(
                ".itinerary-day-card"
            )
            .forEach(function (element) {
                element.remove();
            });

        show(
            $("itinerary-empty")
        );
    }

    /* =====================================================
       HOTELS
       ===================================================== */

    function addHotel(data = null) {

        const tbody =
            $("package-hotels-body");

        const template =
            $("package-hotel-template");

        if (!tbody || !template) {
            return;
        }

        hide(
            $("package-hotels-empty")
        );

        const clone =
            template.content.cloneNode(true);

        const row =
            clone.querySelector(
                ".package-hotel-row"
            );

        if (!row) return;

        setInputValue(
            row,
            ".package-hotel-city",
            data?.city ||
            ""
        );

        setInputValue(
            row,
            ".package-hotel-name",
            data?.hotelName ||
            data?.name ||
            ""
        );

        setInputValue(
            row,
            ".package-hotel-room-category",
            data?.roomCategory ||
            ""
        );

        const meal =
            row.querySelector(
                ".package-hotel-meal-plan"
            );

        if (meal) {

            meal.value =
                data?.mealPlan ||
                "CP";
        }

        setInputValue(
            row,
            ".package-hotel-nights",
            data?.nights ||
            1
        );

        setInputValue(
            row,
            ".package-hotel-rooms",
            data?.rooms ||
            1
        );

        setInputValue(
            row,
            ".package-hotel-remarks",
            data?.remarks ||
            ""
        );

        tbody.appendChild(row);
    }

    function collectHotels() {

        const rows =
            document.querySelectorAll(
                "#package-hotels-body .package-hotel-row"
            );

        return Array.from(rows)
            .map(function (row) {

                return {

                    city:
                        row.querySelector(
                            ".package-hotel-city"
                        )?.value.trim() ||
                        "",

                    hotelName:
                        row.querySelector(
                            ".package-hotel-name"
                        )?.value.trim() ||
                        "",

                    roomCategory:
                        row.querySelector(
                            ".package-hotel-room-category"
                        )?.value.trim() ||
                        "",

                    mealPlan:
                        row.querySelector(
                            ".package-hotel-meal-plan"
                        )?.value ||
                        "",

                    nights:
                        Number(
                            row.querySelector(
                                ".package-hotel-nights"
                            )?.value
                        ) || 0,

                    rooms:
                        Number(
                            row.querySelector(
                                ".package-hotel-rooms"
                            )?.value
                        ) || 0,

                    remarks:
                        row.querySelector(
                            ".package-hotel-remarks"
                        )?.value.trim() ||
                        ""
                };
            });
    }

    function renderHotels(items) {

        const tbody =
            $("package-hotels-body");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!items.length) {

            show(
                $("package-hotels-empty")
            );

            return;
        }

        hide(
            $("package-hotels-empty")
        );

        items.forEach(function (item) {

            addHotel(item);

        });
    }

    function clearHotels() {

        const tbody =
            $("package-hotels-body");

        if (tbody) {
            tbody.innerHTML = "";
        }

        show(
            $("package-hotels-empty")
        );
    }

    /* =====================================================
       CABS
       ===================================================== */

    function addCab(data = null) {

        const tbody =
            $("package-cabs-body");

        const template =
            $("package-cab-template");

        if (!tbody || !template) {
            return;
        }

        hide(
            $("package-cabs-empty")
        );

        const clone =
            template.content.cloneNode(true);

        const row =
            clone.querySelector(
                ".package-cab-row"
            );

        if (!row) return;

        setInputValue(
            row,
            ".package-cab-day",
            data?.day ||
            ""
        );

        setInputValue(
            row,
            ".package-cab-route",
            data?.route ||
            ""
        );

        const vehicleType =
            row.querySelector(
                ".package-cab-vehicle-type"
            );

        if (vehicleType) {

            vehicleType.value =
                data?.vehicleType ||
                "";
        }

        setInputValue(
            row,
            ".package-cab-capacity",
            data?.capacity ||
            ""
        );

        setInputValue(
            row,
            ".package-cab-pickup",
            data?.pickup ||
            ""
        );

        setInputValue(
            row,
            ".package-cab-drop",
            data?.drop ||
            ""
        );

        setInputValue(
            row,
            ".package-cab-notes",
            data?.notes ||
            ""
        );

        tbody.appendChild(row);
    }

    function collectCabs() {

        const rows =
            document.querySelectorAll(
                "#package-cabs-body .package-cab-row"
            );

        return Array.from(rows)
            .map(function (row) {

                return {

                    day:
                        Number(
                            row.querySelector(
                                ".package-cab-day"
                            )?.value
                        ) || 0,

                    route:
                        row.querySelector(
                            ".package-cab-route"
                        )?.value.trim() ||
                        "",

                    vehicleType:
                        row.querySelector(
                            ".package-cab-vehicle-type"
                        )?.value ||
                        "",

                    capacity:
                        Number(
                            row.querySelector(
                                ".package-cab-capacity"
                            )?.value
                        ) || 0,

                    pickup:
                        row.querySelector(
                            ".package-cab-pickup"
                        )?.value.trim() ||
                        "",

                    drop:
                        row.querySelector(
                            ".package-cab-drop"
                        )?.value.trim() ||
                        "",

                    notes:
                        row.querySelector(
                            ".package-cab-notes"
                        )?.value.trim() ||
                        ""
                };
            });
    }

    function renderCabs(items) {

        const tbody =
            $("package-cabs-body");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!items.length) {

            show(
                $("package-cabs-empty")
            );

            return;
        }

        hide(
            $("package-cabs-empty")
        );

        items.forEach(function (item) {

            addCab(item);

        });
    }

    function clearCabs() {

        const tbody =
            $("package-cabs-body");

        if (tbody) {
            tbody.innerHTML = "";
        }

        show(
            $("package-cabs-empty")
        );
    }

    /* =====================================================
       SAVE PACKAGE
       ===================================================== */

    async function savePackage(event) {

        event.preventDefault();

        const db =
            getDB();

        const collectionFn =
            firebaseFunction(
                "collection"
            );

        const addDocFn =
            firebaseFunction(
                "addDoc"
            );

        const updateDocFn =
            firebaseFunction(
                "updateDoc"
            );

        const docFn =
            firebaseFunction(
                "doc"
            );

        if (
            !db ||
            !collectionFn ||
            !addDocFn ||
            !updateDocFn ||
            !docFn
        ) {

            showError(
                "Firebase Firestore is not available."
            );

            return;
        }

        const packageName =
            getValue(
                "package-name"
            );

        const destination =
            getValue(
                "package-destination"
            );

        const category =
            getValue(
                "package-category"
            );

        if (!packageName) {

            showError(
                "Please enter package name."
            );

            return;
        }

        if (!destination) {

            showError(
                "Please enter destination."
            );

            return;
        }

        if (!category) {

            showError(
                "Please select package category."
            );

            return;
        }

        const packageCode =
            getValue(
                "package-display-id"
            ) ||
            generatePackageId();

        const data = {

            packageCode:

                packageCode,

            packageName:

                packageName,

            status:

                getValue(
                    "package-status"
                ) || "Active",

            category:

                category,

            packageType:

                getValue(
                    "package-type"
                ),

            nights:

                getNumber(
                    "package-nights"
                ),

            days:

                getNumber(
                    "package-days"
                ),

            destination:

                destination,

            destinationsCovered:

                getValue(
                    "package-destinations"
                ),

            startLocation:

                getValue(
                    "package-start-location"
                ),

            endLocation:

                getValue(
                    "package-end-location"
                ),

            shortDescription:

                getValue(
                    "package-short-description"
                ),

            featured:

                getChecked(
                    "package-featured"
                ),

            priceType:

                getValue(
                    "package-price-type"
                ),

            price:

                getNumber(
                    "package-price"
                ),

            currency:

                getValue(
                    "package-currency"
                ) || "INR",

            minimumPax:

                getNumber(
                    "package-min-pax"
                ),

            maximumPax:

                getNumber(
                    "package-max-pax"
                ),

            pricingNotes:

                getValue(
                    "package-pricing-notes"
                ),

            itinerary:

                collectItinerary(),

            hotels:

                collectHotels(),

            cabs:

                collectCabs(),

            inclusions:

                getValue(
                    "package-inclusions"
                ),

            exclusions:

                getValue(
                    "package-exclusions"
                ),

            terms:

                getValue(
                    "package-terms"
                ),

            internalNotes:

                getValue(
                    "package-internal-notes"
                ),

            updatedAt:

                new Date().toISOString()
        };

        showLoading();

        try {

            if (editingPackageId) {

                await updateDocFn(

                    docFn(
                        db,
                        "packages",
                        editingPackageId
                    ),

                    data

                );

                showSuccess(
                    "Package updated successfully."
                );

            } else {

                data.createdAt =
                    new Date().toISOString();

                await addDocFn(

                    collectionFn(
                        db,
                        "packages"
                    ),

                    data

                );

                showSuccess(
                    "Package created successfully."
                );
            }

            editingPackageId =
                null;

            closePackageForm();

            await loadPackages();

            notifyPackageUpdate();

        } catch (error) {

            console.error(
                "Error saving package:",
                error
            );

            showError(
                "Unable to save package."
            );

        } finally {

            hideLoading();
        }
    }

    /* =====================================================
       DELETE
       ===================================================== */

    function openDeleteModal(id) {

        deletingPackageId =
            id;

        show(
            $("package-delete-modal")
        );

        const modal =
            $("package-delete-modal");

        if (modal) {

            modal.setAttribute(
                "aria-hidden",
                "false"
            );
        }
    }

    function closeDeleteModal() {

        deletingPackageId =
            null;

        hide(
            $("package-delete-modal")
        );

        const modal =
            $("package-delete-modal");

        if (modal) {

            modal.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }

    async function deletePackage() {

        if (!deletingPackageId) {
            return;
        }

        const db =
            getDB();

        const deleteDocFn =
            firebaseFunction(
                "deleteDoc"
            );

        const docFn =
            firebaseFunction(
                "doc"
            );

        if (
            !db ||
            !deleteDocFn ||
            !docFn
        ) {

            showError(
                "Firebase Firestore is not available."
            );

            return;
        }

        showLoading();

        try {

            await deleteDocFn(

                docFn(
                    db,
                    "packages",
                    deletingPackageId
                )

            );

            closeDeleteModal();

            showSuccess(
                "Package deleted successfully."
            );

            await loadPackages();

            notifyPackageUpdate();

        } catch (error) {

            console.error(
                "Error deleting package:",
                error
            );

            showError(
                "Unable to delete package."
            );

        } finally {

            hideLoading();
        }
    }

    /* =====================================================
       CLOSE FORM
       ===================================================== */

    function closePackageForm() {

        editingPackageId =
            null;

        hide(
            $("package-form-card")
        );

        show(
            $("packages-list-card")
        );

        const form =
            $("package-form");

        if (form) {
            form.reset();
        }

        clearItinerary();
        clearHotels();
        clearCabs();
    }

    /* =====================================================
       TABLE EVENTS
       ===================================================== */

    function handlePackageTableClick(event) {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;

        if (!id) return;

        if (action === "edit") {

            editPackage(id);

        } else if (
            action === "delete"
        ) {

            openDeleteModal(id);

        }
    }

    /* =====================================================
       NESTED EVENTS
       ===================================================== */

    function handleItineraryClick(event) {

        const removeButton =
            event.target.closest(
                ".remove-itinerary-day-btn"
            );

        if (!removeButton) return;

        const card =
            removeButton.closest(
                ".itinerary-day-card"
            );

        if (card) {
            card.remove();
        }

        const remaining =
            document.querySelectorAll(
                "#itinerary-container .itinerary-day-card"
            );

        if (!remaining.length) {

            show(
                $("itinerary-empty")
            );

        }

        updateItineraryDayNumbers();
    }

    function handleHotelClick(event) {

        const button =
            event.target.closest(
                ".remove-package-hotel-btn"
            );

        if (!button) return;

        const row =
            button.closest(
                ".package-hotel-row"
            );

        if (row) {
            row.remove();
        }

        const remaining =
            document.querySelectorAll(
                "#package-hotels-body .package-hotel-row"
            );

        if (!remaining.length) {

            show(
                $("package-hotels-empty")
            );

        }
    }

    function handleCabClick(event) {

        const button =
            event.target.closest(
                ".remove-package-cab-btn"
            );

        if (!button) return;

        const row =
            button.closest(
                ".package-cab-row"
            );

        if (row) {
            row.remove();
        }

        const remaining =
            document.querySelectorAll(
                "#package-cabs-body .package-cab-row"
            );

        if (!remaining.length) {

            show(
                $("package-cabs-empty")
            );

        }
    }

    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {

        const newButton =
            $("package-new-btn");

        if (newButton) {

            newButton.addEventListener(
                "click",
                openNewPackage
            );
        }

        const refreshButton =
            $("package-refresh-btn");

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadPackages
            );
        }

        const form =
            $("package-form");

        if (form) {

            form.addEventListener(
                "submit",
                savePackage
            );
        }

        const closeButton =
            $("package-close-btn");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closePackageForm
            );
        }

        const cancelButton =
            $("package-cancel-btn");

        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closePackageForm
            );
        }

        const table =
            $("packages-table-body");

        if (table) {

            table.addEventListener(
                "click",
                handlePackageTableClick
            );
        }

        const search =
            $("package-search");

        if (search) {

            search.addEventListener(
                "input",
                renderPackages
            );
        }

        const status =
            $("package-status-filter");

        if (status) {

            status.addEventListener(
                "change",
                renderPackages
            );
        }

        const category =
            $("package-category-filter");

        if (category) {

            category.addEventListener(
                "change",
                renderPackages
            );
        }

        const addDay =
            $("add-itinerary-day-btn");

        if (addDay) {

            addDay.addEventListener(
                "click",
                function () {
                    addItineraryDay();
                }
            );
        }

        const itinerary =
            $("itinerary-container");

        if (itinerary) {

            itinerary.addEventListener(
                "click",
                handleItineraryClick
            );
        }

        const addHotelButton =
            $("add-package-hotel-btn");

        if (addHotelButton) {

            addHotelButton.addEventListener(
                "click",
                function () {
                    addHotel();
                }
            );
        }

        const hotels =
            $("package-hotels-body");

        if (hotels) {

            hotels.addEventListener(
                "click",
                handleHotelClick
            );
        }

        const addCabButton =
            $("add-package-cab-btn");

        if (addCabButton) {

            addCabButton.addEventListener(
                "click",
                function () {
                    addCab();
                }
            );
        }

        const cabs =
            $("package-cabs-body");

        if (cabs) {

            cabs.addEventListener(
                "click",
                handleCabClick
            );
        }

        const deleteCancel =
            $("package-delete-cancel");

        if (deleteCancel) {

            deleteCancel.addEventListener(
                "click",
                closeDeleteModal
            );
        }

        const deleteConfirm =
            $("package-delete-confirm");

        if (deleteConfirm) {

            deleteConfirm.addEventListener(
                "click",
                deletePackage
            );
        }

        const deleteModal =
            $("package-delete-modal");

        if (deleteModal) {

            const backdrop =
                deleteModal.querySelector(
                    ".module-modal-backdrop"
                );

            if (backdrop) {

                backdrop.addEventListener(
                    "click",
                    closeDeleteModal
                );
            }
        }

        const itineraryContainer =
            $("itinerary-container");

        if (itineraryContainer) {

            itineraryContainer.addEventListener(
                "input",
                function (event) {

                    if (
                        event.target.classList.contains(
                            "itinerary-day-number"
                        )
                    ) {

                        const card =
                            event.target.closest(
                                ".itinerary-day-card"
                            );

                        const label =
                            card?.querySelector(
                                ".day-number"
                            );

                        if (label) {

                            label.textContent =
                                `Day ${event.target.value || 1}`;

                        }
                    }
                }
            );
        }
    }

    /* =====================================================
       LOADING
       ===================================================== */

    function showLoading() {

        show(
            $("packages-loading")
        );

        const overlay =
            $("packages-loading");

        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "false"
            );
        }
    }

    function hideLoading() {

        hide(
            $("packages-loading")
        );

        const overlay =
            $("packages-loading");

        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }
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

        if (
            typeof window.showNotification ===
            "function"
        ) {

            window.showNotification(
                message,
                "success"
            );

            return;
        }

        console.log(
            "SUCCESS:",
            message
        );
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

        if (
            typeof window.showNotification ===
            "function"
        ) {

            window.showNotification(
                message,
                "error"
            );

            return;
        }

        console.error(
            "ERROR:",
            message
        );
    }

    /* =====================================================
       MODULE UPDATE EVENT
       ===================================================== */

    function notifyPackageUpdate() {

        window.dispatchEvent(
            new CustomEvent(
                "erp:packages-updated"
            )
        );
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initPackages() {

        if (initialized) {

            await loadPackages();

            return;
        }

        initialized = true;

        bindEvents();

        await loadPackages();
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.PackagesModule = {

        init:
            initPackages,

        refresh:
            loadPackages,

        openNew:
            openNewPackage,

        edit:
            editPackage,

        addItineraryDay:
            addItineraryDay,

        addHotel:
            addHotel,

        addCab:
            addCab

    };

    /* =====================================================
       DOM READY
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if ($("packages-page")) {

                initPackages();

            }
        }
    );

    /* =====================================================
       SPA MODULE LOADER
       ===================================================== */

    window.addEventListener(
        "erp:module-loaded",
        function (event) {

            if (
                event.detail &&
                (
                    event.detail.module ===
                        "packages" ||
                    event.detail.name ===
                        "packages"
                )
            ) {

                initPackages();

            }
        }
    );

})();

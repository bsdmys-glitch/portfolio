(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ProjectFilter = api;
  }

  if (root.document) {
    const start = () => api.mount(root.document);
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const FILTER_GROUPS = ["discipline", "time", "affiliation"];

  const FILTER_ORDER = {
    discipline: [
      "Research & Strategy",
      "Spatial Design",
      "Product Design",
      "Visual Communication",
      "Community & Programmes"
    ],
    typology: [
      "Building & Campus",
      "Urban & Heritage",
      "Digital & Product",
      "Research & Publication",
      "Visual & Exhibition",
      "Community & Spatial"
    ],
    time: ["2025–present", "2022–2024", "2019–2021", "2016–2018", "Before 2016", "TBC"],
    affiliation: [
      "AN-Design",
      "Aedas",
      "SOM",
      "Studio Zhu-Pei",
      "Academic / University",
      "Independent / Self-initiated",
      "Other Collaborators"
    ]
  };

  const normalize = (value) => String(value || "").trim().toLocaleLowerCase();

  const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

  const orderedUnique = (group, values) => {
    const unique = new Set(values.filter(Boolean));
    const ordered = (FILTER_ORDER[group] || []).filter((value) => unique.has(value));
    const remaining = uniqueSorted([...unique].filter((value) => !ordered.includes(value)));
    return [...ordered, ...remaining];
  };

  const includesAny = (value, terms) => {
    const normalized = normalize(value);
    return terms.some((term) => normalized.includes(normalize(term)));
  };

  const classifyDiscipline = (value) => {
    if (includesAny(value, ["urban strategy", "financing research", "strategy research", "professional practice", "speculative practice"])) {
      return "Research & Strategy";
    }
    if (includesAny(value, ["public interest", "knowledge practice", "community programme"])) {
      return "Community & Programmes";
    }
    if (includesAny(value, ["visual communication", "exhibition design", "information design", "publication design", "identity design", "ip design", "brand character"])) {
      return "Visual Communication";
    }
    if (includesAny(value, ["product design", "interface design", "object design"])) {
      return "Product Design";
    }
    if (includesAny(value, [
      "architecture",
      "campus planning",
      "spatial design",
      "kindergarten design",
      "urban regeneration",
      "masterplanning",
      "urban design",
      "landscape planning",
      "competition proposal"
    ])) {
      return "Spatial Design";
    }
    return "Other";
  };

  const classifyTypology = (value) => {
    if (includesAny(value, [
      "adaptive reuse",
      "historic",
      "heritage",
      "rural renewal",
      "urban regeneration",
      "masterplanning",
      "urban design",
      "cultural tourism",
      "cultural district",
      "cultural space"
    ])) {
      return "Urban & Heritage";
    }
    if (includesAny(value, [
      "architecture",
      "educational building",
      "kindergarten",
      "museum",
      "cultural & commercial",
      "mixed-use",
      "convention & exhibition"
    ])) {
      return "Building & Campus";
    }
    if (includesAny(value, ["ai product", "digital product", "object design", "brand character"])) {
      return "Digital & Product";
    }
    if (includesAny(value, ["financing research", "publication design", "speculative practice", "knowledge practice", "knowledge system", "knowledge base"])) {
      return "Research & Publication";
    }
    if (includesAny(value, ["identity design", "visual communication", "exhibition"])) {
      return "Visual & Exhibition";
    }
    if (includesAny(value, ["community design", "concept proposal"])) {
      return "Community & Spatial";
    }
    return "Other";
  };

  const affiliationBucket = (value) => {
    const normalized = normalize(value);
    if (normalized.includes("an-design")) return "AN-Design";
    if (normalized.includes("aedas")) return "Aedas";
    if (/\bsom\b/.test(normalized)) return "SOM";
    if (normalized.includes("zhu-pei")) return "Studio Zhu-Pei";
    if (includesAny(normalized, ["virginia tech", "aa spring", "chicago studio", "brandeis", "tsinghua"])) {
      return "Academic / University";
    }
    if (includesAny(normalized, ["independent", "volunteer-led", "personal project"])) {
      return "Independent / Self-initiated";
    }
    return "Other Collaborators";
  };

  const splitScope = (value) => {
    const parts = String(value || "")
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      discipline: parts[0] || "Other",
      typology: parts.slice(1).join(" / ") || parts[0] || "Other"
    };
  };

  const timeBucket = (value) => {
    const raw = String(value || "").replace(/–/g, "-");
    if (/tbc/i.test(raw)) return "TBC";

    const years = [...raw.matchAll(/\d{4}/g)].map((match) => Number(match[0]));
    const start = years[0];

    if (!start) return raw || "Other";
    if (start >= 2025) return "2025–present";
    if (start >= 2022) return "2022–2024";
    if (start >= 2019) return "2019–2021";
    if (start >= 2016) return "2016–2018";
    return "Before 2016";
  };

  const filterProjects = (projects, filters) => {
    const query = normalize(filters && filters.query);

    return projects.filter((project) => {
      const matchesQuery = !query || normalize(project.searchText).includes(query);
      if (!matchesQuery) return false;

      return FILTER_GROUPS.every((group) => {
        const selected = Array.isArray(filters && filters[group]) ? filters[group] : [];
        return selected.length === 0 || selected.includes(project[group]);
      });
    });
  };

  const textOf = (element) => (element ? element.textContent.trim() : "");

  const readProject = (row) => {
    const time = textOf(row.querySelector(".project-time"));
    const name = textOf(row.querySelector(".project-name"));
    const scope = splitScope(textOf(row.querySelector(".project-type")));
    const affiliationRaw = textOf(row.querySelector(".project-unit"));
    const discipline = classifyDiscipline(`${scope.discipline} / ${scope.typology}`);
    const typology = classifyTypology(scope.typology);
    const affiliation = affiliationBucket(affiliationRaw);
    const sectionElement = row.closest(".index-section");
    const section = textOf(sectionElement && sectionElement.querySelector("h2"));
    const searchText = [
      name,
      time,
      scope.discipline,
      scope.typology,
      discipline,
      typology,
      affiliationRaw,
      affiliation,
      section
    ].join(" ");

    return {
      row,
      name,
      discipline,
      typology,
      time: timeBucket(time),
      affiliation,
      section,
      sectionElement,
      searchText
    };
  };

  const createOption = (document, group, value, selected, onChange) => {
    const label = document.createElement("label");
    label.className = "filter-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.checked = selected.includes(value);
    input.addEventListener("change", () => onChange(group, value, input.checked));

    const text = document.createElement("span");
    text.textContent = value;

    label.append(input, text);
    return label;
  };

  const mount = (document) => {
    const filterRoot = document.querySelector("[data-project-filters]");
    if (!filterRoot) return null;

    const rows = [...document.querySelectorAll(".project-row:not(.project-row-head)")];
    const projects = rows.filter((row) => {
      const link = row.querySelector(".project-name a[href]");
      const href = link?.getAttribute("href")?.trim();
      const published = Boolean(href && !href.startsWith("#") && ["http:", "https:"].includes(link.protocol));
      row.hidden = !published;
      if (published) row.setAttribute("data-project-filter-row", "");
      return published;
    }).map(readProject);
    const sections = [...document.querySelectorAll(".project-index .index-section")];
    const total = document.querySelector("[data-project-total]");
    if (total) total.textContent = String(projects.length);
    const state = { query: "", discipline: [], time: [], affiliation: [] };
    const count = filterRoot.querySelector("[data-filter-count]");
    const clear = filterRoot.querySelector("[data-filter-clear]");
    const empty = filterRoot.querySelector("[data-filter-empty]");
    const search = filterRoot.querySelector("[data-project-search]");
    const controls = [...filterRoot.querySelectorAll(".filter-control")];

    const closeOpenFilters = (except = null) => {
      controls.forEach((control) => {
        if (control !== except && control.open) control.removeAttribute("open");
      });
    };

    controls.forEach((control) => {
      control.addEventListener("toggle", () => {
        if (control.open) closeOpenFilters(control);
      });
    });

    document.addEventListener("click", (event) => {
      if (!filterRoot.contains(event.target)) closeOpenFilters();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOpenFilters();
    });

    const hasActiveFilters = () =>
      Boolean(state.query) || FILTER_GROUPS.some((group) => state[group].length > 0);

    const updateActiveIndicators = () => {
      FILTER_GROUPS.forEach((group) => {
        const indicator = filterRoot.querySelector(`[data-filter-active="${group}"]`);
        if (!indicator) return;
        const amount = state[group].length;
        indicator.textContent = amount ? `${amount}` : "";
        indicator.setAttribute("aria-hidden", amount ? "false" : "true");
      });
    };

    const update = () => {
      const matched = filterProjects(projects, state);
      const matchedRows = new Set(matched.map((project) => project.row));

      projects.forEach((project) => {
        project.row.hidden = !matchedRows.has(project.row);
      });

      sections.forEach((section) => {
        const hasVisibleProject = projects.some(
          (project) => project.sectionElement === section && matchedRows.has(project.row)
        );
        if (section) section.hidden = !hasVisibleProject;
      });

      if (count) count.textContent = String(matched.length);
      if (empty) empty.hidden = matched.length > 0;
      if (clear) clear.hidden = !hasActiveFilters();
      updateActiveIndicators();
    };

    const updateGroup = (group, value, checked) => {
      if (checked) {
        state[group] = [...state[group], value];
      } else {
        state[group] = state[group].filter((item) => item !== value);
      }
      update();
    };

    FILTER_GROUPS.forEach((group) => {
      const container = filterRoot.querySelector(`[data-filter-options="${group}"]`);
      if (!container) return;

      const values = orderedUnique(group, projects.map((project) => project[group]));
      values.forEach((value) => container.append(createOption(document, group, value, state[group], updateGroup)));
    });

    search?.addEventListener("input", () => {
      state.query = search.value.trim();
      update();
    });

    clear?.addEventListener("click", () => {
      state.query = "";
      FILTER_GROUPS.forEach((group) => {
        state[group] = [];
        filterRoot.querySelectorAll(`[data-filter-options="${group}"] input`).forEach((input) => {
          input.checked = false;
        });
      });
      if (search) search.value = "";
      closeOpenFilters();
      update();
    });

    update();
    return { projects, state, update };
  };

  return {
    affiliationBucket,
    classifyDiscipline,
    classifyTypology,
    filterProjects,
    mount,
    normalize,
    splitScope,
    timeBucket
  };
});

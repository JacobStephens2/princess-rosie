const ASSET_ROOT = "../../../../shared/edition/source-media";
const ROUTE_END = 0.76;
const ROUTE_SECONDS = 18;

const places = {
  "rose-garden": {
    name: "Rosalia’s Rose Garden",
    guest: "Mom",
    background: `${ASSET_ROOT}/flight/rose-garden-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-mom.png`,
    cameoAction: "tends the waking roses",
    cameo: { left: 59, top: 46, width: 11 },
  },
  lacewood: {
    name: "Zélie’s Lacewood",
    guest: "Gram",
    background: `${ASSET_ROOT}/lacewood/lacewood-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-gram.png`,
    cameoAction: "follows a silver ribbon",
    cameo: { left: 61, top: 44, width: 10 },
  },
  abbey: {
    name: "Golden Bell Abbey",
    guest: "Pop",
    background: `${ASSET_ROOT}/abbey/abbey-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-pop.png`,
    cameoAction: "listens beneath the golden bells",
    cameo: { left: 60, top: 43, width: 10 },
  },
  cloister: {
    name: "Cloister of Clouds",
    guest: "Beasley",
    background: `${ASSET_ROOT}/cloister/cloister-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-beasley.png`,
    cameoAction: "pounces after Stella’s sparkles",
    cameo: { left: 60, top: 60, width: 9 },
  },
  "pellegrino-peak": {
    name: "Pellegrino Peak",
    guest: "Uncle",
    background: `${ASSET_ROOT}/pellegrino-peak/pellegrino-peak-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-uncle.png`,
    cameoAction: "watches the flower petals lift",
    cameo: { left: 60, top: 45, width: 10 },
  },
  "sapphire-sea": {
    name: "Sapphire Sea",
    guest: "Aunt",
    background: `${ASSET_ROOT}/sapphire-sea/sapphire-sea-background.png`,
    cutout: `${ASSET_ROOT}/journey/family-guest-aunt.png`,
    cameoAction: "waves from the luminous cove",
    cameo: { left: 59, top: 45, width: 10 },
  },
};

const variants = [
  {
    key: "A",
    name: "Star-side reveal",
    title: "Keep the Family Guest at the arrival",
    description:
      "This is the current composition. The Place belongs to its scenery and Stella until the Birthday Star approach reveals who needs help.",
    questions: [
      "Does the reveal make the Birthday Star feel like a true arrival?",
      "Before the reveal, is it clear that Stella is helping anyone?",
    ],
  },
  {
    key: "B",
    name: "Sparkle companion",
    title: "Let the Family Guest travel beside Stella",
    description:
      "The existing cutout stays visible at background scale and follows Stella’s sparkle trail, then moves beside the Birthday Star for the approach.",
    questions: [
      "Does the companion compete with Flight Control or clarify the purpose?",
      "Does one shared chasing motion work for every Family Guest?",
      "Does the same cutout survive this much screen time?",
    ],
  },
  {
    key: "C",
    name: "Place cameo",
    title: "Give each Family Guest one mid-passage vignette",
    description:
      "A shared timing pattern gives each Place one brief, data-driven cameo. The guest leaves the foreground before returning beside the Birthday Star.",
    questions: [
      "Does one sighting establish who the Place is for without crowding it?",
      "Does the gap preserve the feeling of arriving at the Birthday Star?",
      "Can movement, scale, and placement sell distinct actions without more art?",
    ],
  },
];

const elements = {
  placeSelect: document.querySelector("#place-select"),
  progress: document.querySelector("#progress"),
  playToggle: document.querySelector("#play-toggle"),
  placeArt: document.querySelector("#place-art"),
  sparkleTrail: document.querySelector("#sparkle-trail"),
  cameoMarker: document.querySelector("#cameo-marker"),
  arrivalHalo: document.querySelector("#arrival-halo"),
  star: document.querySelector("#birthday-star"),
  guest: document.querySelector("#family-guest"),
  stella: document.querySelector("#stella"),
  placeName: document.querySelector("#place-name"),
  phaseName: document.querySelector("#phase-name"),
  stateVariant: document.querySelector("#state-variant"),
  stateGuest: document.querySelector("#state-guest"),
  statePresence: document.querySelector("#state-presence"),
  stateAction: document.querySelector("#state-action"),
  stateCutout: document.querySelector("#state-cutout"),
  stateProgress: document.querySelector("#state-progress"),
  variantTitle: document.querySelector("#variant-title"),
  variantDescription: document.querySelector("#variant-description"),
  variantQuestions: document.querySelector("#variant-questions"),
  variantLabel: document.querySelector("#variant-label"),
  previousVariant: document.querySelector("#previous-variant"),
  nextVariant: document.querySelector("#next-variant"),
};

const params = new URLSearchParams(window.location.search);
let variantIndex = Math.max(
  0,
  variants.findIndex((variant) => variant.key === (params.get("variant") || "A").toUpperCase()),
);
let placeKey = places[params.get("place")] ? params.get("place") : "cloister";
let progress = clamp(Number(params.get("progress") || 0.08), 0, 1);
let playing = params.get("playing") !== "0";
let previousTime = performance.now();

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

function mix(from, to, amount) {
  return from + (to - from) * clamp(amount, 0, 1);
}

function ease(amount) {
  const t = clamp(amount, 0, 1);
  return t * t * (3 - 2 * t);
}

function setUrl() {
  const next = new URLSearchParams();
  next.set("variant", variants[variantIndex].key);
  next.set("place", placeKey);
  next.set("progress", progress.toFixed(3));
  next.set("playing", playing ? "1" : "0");
  history.replaceState(null, "", `${window.location.pathname}?${next}`);
}

function buildControls() {
  for (const [key, place] of Object.entries(places)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${place.name} — ${place.guest}`;
    elements.placeSelect.append(option);
  }
  elements.placeSelect.value = placeKey;

  for (let index = 0; index < 15; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.className = "sparkle";
    sparkle.style.left = `${4 + ((index * 17) % 88)}%`;
    sparkle.style.top = `${13 + ((index * 31) % 72)}%`;
    sparkle.style.setProperty("--spark-delay", `${-index * 77}ms`);
    sparkle.style.setProperty("--spark-opacity", `${0.35 + (index % 4) * 0.14}`);
    sparkle.style.setProperty("--spark-scale", `${0.6 + (index % 3) * 0.25}`);
    elements.sparkleTrail.append(sparkle);
  }

  elements.stella.src = `${ASSET_ROOT}/flight/rosie-stella.png`;
  elements.star.src = `${ASSET_ROOT}/journey/birthday-star.png`;
}

function switchVariant(offset) {
  variantIndex = (variantIndex + offset + variants.length) % variants.length;
  setUrl();
  render();
}

function guestPresentation(place, variant) {
  const inApproach = progress >= ROUTE_END;
  const approachAmount = ease((progress - ROUTE_END) / (1 - ROUTE_END));
  const final = { left: 82, top: 57, width: place.guest === "Beasley" ? 13 : 15 };

  if (inApproach) {
    return {
      visible: true,
      presence: "beside the Birthday Star",
      action: "waits for Stella",
      treatment: "full cutout, foreground scale",
      ...final,
      rotate: 0,
      bob: Math.sin(progress * Math.PI * 10) * 0.5,
    };
  }

  if (variant.key === "A") {
    return {
      visible: false,
      presence: "absent during the Single Route",
      action: "waiting off-stage",
      treatment: "reserved for the arrival",
      ...final,
      rotate: 0,
      bob: 0,
    };
  }

  if (variant.key === "B") {
    const stellaLeft = mix(19, 72, progress / ROUTE_END);
    const chasePulse = Math.sin(progress * Math.PI * 14);
    return {
      visible: true,
      presence: "continuously behind Stella",
      action: "follows the sparkle trail",
      treatment: "same cutout, small background scale",
      left: stellaLeft - 11 + chasePulse * 1.3,
      top: 58 + Math.sin(progress * Math.PI * 9) * 2.4,
      width: place.guest === "Beasley" ? 9.5 : 10.5,
      rotate: chasePulse * (place.guest === "Beasley" ? 7 : 2),
      bob: 0,
    };
  }

  const cameoStarts = 0.16;
  const cameoEnds = 0.49;
  const cameoVisible = progress >= cameoStarts && progress <= cameoEnds;
  const cameoProgress = clamp((progress - cameoStarts) / (cameoEnds - cameoStarts), 0, 1);
  const actionPulse = Math.sin(cameoProgress * Math.PI * 5);
  return {
    visible: cameoVisible,
    presence: cameoVisible ? "one mid-passage sighting" : "clear space before the arrival",
    action: cameoVisible ? place.cameoAction : "off-stage",
    treatment: "same cutout, placed as a scenery vignette",
    left: place.cameo.left + actionPulse * (place.guest === "Beasley" ? 2.2 : 0.6),
    top: place.cameo.top + actionPulse * 1.2,
    width: place.cameo.width,
    rotate: actionPulse * (place.guest === "Beasley" ? 8 : 1.8),
    bob: 0,
  };
}

function render() {
  const variant = variants[variantIndex];
  const place = places[placeKey];
  const inApproach = progress >= ROUTE_END;
  const phaseProgress = inApproach
    ? (progress - ROUTE_END) / (1 - ROUTE_END)
    : progress / ROUTE_END;
  const stellaLeft = inApproach ? mix(72, 66, ease(phaseProgress)) : mix(19, 72, phaseProgress);
  const stellaTop = inApproach ? mix(48, 45, phaseProgress) : 48 + Math.sin(progress * Math.PI * 3.2) * 7;
  const guest = guestPresentation(place, variant);

  elements.placeArt.src = place.background;
  elements.placeArt.alt = `${place.name} Place Illustration`;
  elements.guest.src = place.cutout;
  elements.guest.alt = `${place.guest}, the Family Guest`;
  elements.placeName.textContent = place.name;
  elements.phaseName.textContent = inApproach ? "Birthday Star approach" : "Single Route";

  elements.stella.style.left = `${stellaLeft}%`;
  elements.stella.style.top = `${stellaTop}%`;
  elements.stella.style.transform = `translate(-50%, -50%) rotate(${Math.sin(progress * Math.PI * 4) * 1.2}deg)`;

  elements.sparkleTrail.style.left = `${stellaLeft - 25}%`;
  elements.sparkleTrail.style.top = `${stellaTop - 12}%`;
  elements.sparkleTrail.style.opacity = inApproach ? `${mix(1, 0.2, phaseProgress)}` : "1";

  elements.guest.style.left = `${guest.left}%`;
  elements.guest.style.top = `${guest.top + guest.bob}%`;
  elements.guest.style.width = `${guest.width}%`;
  elements.guest.style.opacity = guest.visible ? "1" : "0";
  elements.guest.style.transform = `translate(-50%, -50%) rotate(${guest.rotate}deg)`;

  const cameoOn = variant.key === "C" && guest.visible && !inApproach;
  elements.cameoMarker.style.display = cameoOn ? "block" : "none";
  elements.cameoMarker.style.left = `${guest.left - 5}%`;
  elements.cameoMarker.style.top = `${guest.top - 7}%`;
  elements.arrivalHalo.style.opacity = inApproach ? `${mix(0.35, 1, phaseProgress)}` : "0";
  elements.star.style.opacity = inApproach ? "1" : "0";

  elements.stateVariant.textContent = `${variant.key} · ${variant.name}`;
  elements.stateGuest.textContent = place.guest;
  elements.statePresence.textContent = guest.presence;
  elements.stateAction.textContent = guest.action;
  elements.stateCutout.textContent = guest.treatment;
  elements.stateProgress.textContent = `${Math.round(progress * 100)}% · ${inApproach ? "approach" : "passage"}`;

  elements.variantTitle.textContent = variant.title;
  elements.variantDescription.textContent = variant.description;
  elements.variantQuestions.replaceChildren(
    ...variant.questions.map((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      return item;
    }),
  );
  elements.variantLabel.textContent = `${variant.key} (${variant.name})`;
  elements.progress.value = String(progress);
  elements.playToggle.textContent = playing ? "Pause" : "Play";
}

function animate(time) {
  const delta = Math.min((time - previousTime) / 1000, 0.1);
  previousTime = time;
  if (playing) {
    progress = (progress + delta / ROUTE_SECONDS) % 1;
    render();
  }
  requestAnimationFrame(animate);
}

elements.placeSelect.addEventListener("change", (event) => {
  placeKey = event.target.value;
  setUrl();
  render();
});

elements.progress.addEventListener("input", (event) => {
  progress = Number(event.target.value);
  playing = false;
  setUrl();
  render();
});

elements.playToggle.addEventListener("click", () => {
  playing = !playing;
  setUrl();
  render();
});

elements.previousVariant.addEventListener("click", () => switchVariant(-1));
elements.nextVariant.addEventListener("click", () => switchVariant(1));

window.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  ) {
    return;
  }
  if (event.key === "ArrowLeft") {
    switchVariant(-1);
  } else if (event.key === "ArrowRight") {
    switchVariant(1);
  }
});

buildControls();
render();
requestAnimationFrame(animate);

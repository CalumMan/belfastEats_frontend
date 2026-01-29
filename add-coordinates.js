const fs = require("fs");
const axios = require("axios");

const INPUT_FILE = "src/assets/businesses.json";
const OUTPUT_FILE = "businesses_with_coords.json";

async function geocodePostcode(postcode) {
  const cleaned = postcode.trim();
  try {
    const res = await axios.get(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`
    );
    if (res.data.status !== 200 || !res.data.result) {
      console.warn("No result for postcode:", cleaned);
      return null;
    }
    return {
      lat: res.data.result.latitude,
      lng: res.data.result.longitude,
    };
  } catch (err) {
    console.error("Error geocoding", cleaned, err.response?.data || err.message);
    return null;
  }
}

async function main() {
  const raw = fs.readFileSync(INPUT_FILE, "utf8");
  const businesses = JSON.parse(raw);

  for (const biz of businesses) {
    if (biz.lat != null && biz.lng != null) {
      // already has coords, skip
      continue;
    }

    console.log(`Geocoding ${biz.name} – ${biz.postcode}`);
    const pos = await geocodePostcode(biz.postcode);

    if (pos) {
      biz.lat = pos.lat;
      biz.lng = pos.lng;
    } else {
      // fall back to something like Belfast centre if you want
      // biz.lat = 54.5973;
      // biz.lng = -5.9301;
    }

    // polite delay so you don't hammer the API
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(businesses, null, 2));
  console.log("Done. Wrote:", OUTPUT_FILE);
}

main().catch((e) => console.error(e));

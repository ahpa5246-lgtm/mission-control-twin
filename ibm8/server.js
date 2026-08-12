const express = require('express');
const { twoline2satrec, propagate, gstime, eciToGeodetic } = require('satellite.js');
const SunCalc = require('suncalc');
// Native fetch is available in Node 18+

const app = express();
const PORT = process.env.PORT || 3000;

// Caches for fault tolerance
let cachedState = null;
const cachedVisualPasses = {}; // Keyed by `${lat},${lng}`
let latestTLE = null;

// Fetch TLE Data from CelesTrak
async function updateTLE() {
    try {
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle');
        if (!response.ok) throw new Error(`Failed to fetch TLE: ${response.statusText}`);

        const text = await response.text();
        const lines = text.trim().split('\n');

        if (lines.length >= 3) {
            latestTLE = [lines[1].trim(), lines[2].trim()];
            console.log(`[${new Date().toISOString()}] Successfully updated ISS TLE data.`);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error updating TLE:`, error.message);
    }
}

// Initial fetch and 6-hour refresh interval
updateTLE();
setInterval(updateTLE, 6 * 60 * 60 * 1000);

app.get('/api/state', async (req, res) => {
    try {
        if (!latestTLE) {
            throw new Error('TLE data is not available yet');
        }

        // 1. Calculate precise position using satellite.js
        const satrec = twoline2satrec(latestTLE[0], latestTLE[1]);
        const date = new Date();
        const positionAndVelocity = propagate(satrec, date);

        if (!positionAndVelocity.position || !positionAndVelocity.velocity) {
            throw new Error('Satellite propagation failed');
        }

        const gmst = gstime(date);
        const positionGd = eciToGeodetic(positionAndVelocity.position, gmst);

        // Convert radians to degrees
        const rad2deg = 180 / Math.PI;
        const latitude = positionGd.latitude * rad2deg;
        const longitude = positionGd.longitude * rad2deg;
        const altitude_km = positionGd.height;

        // Convert velocity from km/s to km/h
        const v = positionAndVelocity.velocity;
        const velocity_kmh = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) * 3600;

        // 2. Calculate Daylight using SunCalc
        const sunPosition = SunCalc.getPosition(date, latitude, longitude);
        const isDaylight = sunPosition.altitude > 0;

        // 3. Fetch astronauts and reverse geocoding in parallel
        const [astrosRes, geoRes] = await Promise.all([
            fetch('http://api.open-notify.org/astros.json'),
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
        ]);

        if (!astrosRes.ok) throw new Error(`Open Notify API failed: ${astrosRes.statusText}`);
        if (!geoRes.ok) throw new Error(`BigDataCloud API failed: ${geoRes.statusText}`);

        const astrosData = await astrosRes.json();
        const geoData = await geoRes.json();

        // Parse Astronauts
        let astronauts = [];
        if (astrosData && astrosData.people) {
            astronauts = astrosData.people
                .filter(p => p.craft === 'ISS')
                .map(p => ({ name: p.name, craft: p.craft }));
        }

        // Parse Location
        let locationName = "Unknown";
        let locationType = "unknown";

        if (geoData.countryName) {
            locationName = geoData.countryName;
            locationType = "country";
        } else if (geoData.locality) {
            locationName = geoData.locality;
            const locLower = geoData.locality.toLowerCase();
            if (locLower.includes("ocean") || locLower.includes("sea")) {
                locationType = "ocean";
            }
        }

        // 4. Construct Final Response
        const responseData = {
            latitude: latitude,
            longitude: longitude,
            altitude_km: altitude_km,
            velocity_kmh: velocity_kmh,
            isDaylight: isDaylight,
            locationName: locationName,
            locationType: locationType,
            astronautCount: astronauts.length,
            astronauts: astronauts,
            timestamp: date.toISOString(),
            isStale: false
        };

        cachedState = responseData;
        return res.json(responseData);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/state:`, error.message);
        if (cachedState) {
            const fallbackResponse = {
                ...cachedState,
                isStale: true,
                timestamp: new Date().toISOString()
            };
            return res.json(fallbackResponse);
        }
        return res.status(500).json({ error: "Internal Server Error. No cache available." });
    }
});

app.get('/api/visualpass', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Missing 'lat' or 'lng' query parameters" });
    }

    const cacheKey = `${lat},${lng}`;

    try {
        const apiKey = process.env.N2YO_API_KEY;
        if (!apiKey) {
            throw new Error("N2YO_API_KEY is not set in environment variables");
        }

        // N2YO Visual Passes Endpoint:
        // /rest/v1/satellite/visualpasses/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{days}/{min_visibility}
        const n2yoUrl = `https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${lat}/${lng}/0/10/300/&apiKey=${apiKey}`;

        const response = await fetch(n2yoUrl);
        if (!response.ok) throw new Error(`N2YO API failed: ${response.statusText}`);

        const data = await response.json();

        const responseData = {
            data: data,
            timestamp: new Date().toISOString(),
            isStale: false
        };

        cachedVisualPasses[cacheKey] = responseData;
        return res.json(responseData);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /api/visualpass:`, error.message);
        if (cachedVisualPasses[cacheKey]) {
            const fallbackResponse = {
                ...cachedVisualPasses[cacheKey],
                isStale: true,
                timestamp: new Date().toISOString()
            };
            return res.json(fallbackResponse);
        }
        return res.status(500).json({ error: "Internal Server Error. No cache available." });
    }
});

app.listen(PORT, () => {
    console.log(`Mission Control Twin server running on port ${PORT}`);
});

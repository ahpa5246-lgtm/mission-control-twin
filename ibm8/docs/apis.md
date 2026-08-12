# Mission Control Twin - API Documentation

## `/api/state`

Fetches the complete real-time state of the International Space Station (ISS), aggregated from multiple data sources.

### Method
`GET`

### Query Parameters
*None*

### Response Format
Returns a strict JSON data contract. If any external dependency fails, the endpoint falls back to the last successfully cached response and sets `"isStale": true`.

```json
{
  "latitude": -51.350616428784424,
  "longitude": -156.9602528775439,
  "altitude_km": 425.2678120302061,
  "velocity_kmh": 27581.427389140404,
  "isDaylight": false,
  "locationName": "South Pacific Ocean",
  "locationType": "ocean",
  "astronautCount": 7,
  "astronauts": [
    {
      "name": "Oleg Kononenko",
      "craft": "ISS"
    },
    {
      "name": "Nikolai Chub",
      "craft": "ISS"
    },
    {
      "name": "Tracy Caldwell Dyson",
      "craft": "ISS"
    },
    {
      "name": "Matthew Dominick",
      "craft": "ISS"
    },
    {
      "name": "Michael Barratt",
      "craft": "ISS"
    },
    {
      "name": "Jeanette Epps",
      "craft": "ISS"
    },
    {
      "name": "Alexander Grebenkin",
      "craft": "ISS"
    }
  ],
  "timestamp": "2026-08-10T19:26:47.123Z",
  "isStale": false
}
```

---

## `/api/visualpass`

Calculates the next visual passes for the ISS based on a given observer's latitude and longitude using the N2YO API.

### Method
`GET`

### Query Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `lat`     | Number | Yes      | Observer's latitude in decimal degrees. |
| `lng`     | Number | Yes      | Observer's longitude in decimal degrees. |

### Environment Variables
Requires `N2YO_API_KEY` to be set.

### Response Format
If the N2YO API is temporarily unavailable, returns the most recently cached pass data for the specified coordinates with `"isStale": true`.

```json
{
  "data": {
    "info": {
      "satid": 25544,
      "satname": "SPACE STATION",
      "transactionscount": 1,
      "passescount": 1
    },
    "passes": [
      {
        "startUTC": 1723321300,
        "startAz": 223,
        "startAzCompass": "SW",
        "startEl": 10,
        "maxUTC": 1723321500,
        "maxAz": 305,
        "maxAzCompass": "NW",
        "maxEl": 55,
        "endUTC": 1723321700,
        "endAz": 35,
        "endAzCompass": "NE",
        "endEl": 10,
        "mag": -1.5,
        "duration": 400
      }
    ]
  },
  "timestamp": "2026-08-10T19:26:47.123Z",
  "isStale": false
}
```

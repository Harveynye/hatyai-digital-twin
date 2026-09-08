Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZGFkZDA5NS1lYmQxLTRlYmYtYTgxZC0xYTNiNzU4NTRmNDciLCJpZCI6MzI0NjE4LCJpYXQiOjE3NTMzMzgxNDd9.v1Zu9SQtxcFklATKFLRzHuJEnkw_FfVGLf0Kmel_0Yg";

async function main() {
    const viewer = new Cesium.Viewer("cesiumContainer", {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: true,
        timeline: true,
        terrainShadows: Cesium.ShadowMode.ENABLED
    });

    viewer.scene.globe.depthTestAgainstTerrain = false;

    function liftPointAboveGround(entity, height = 500) {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        const cartographic = Cesium.Cartographic.fromCartesian(position);

        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);

        entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    }

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(100.4747, 7.0084, 70000)
    });

    const buildings = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(buildings);

    // -----------------------------
    // FLOOD SUSCEPTIBILITY LAYER
    // -----------------------------
    const floodRisk = await Cesium.GeoJsonDataSource.load(
        "flood_risk_simplified.geojson",
        {
            stroke: Cesium.Color.RED,
            fill: Cesium.Color.RED.withAlpha(0.12),
            strokeWidth: 0
        }
    );

    viewer.dataSources.add(floodRisk);

    // -----------------------------
    // RAINFALL STATIONS
    // -----------------------------
 const response = await fetch(
    "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h"
);

const thaiWaterData = await response.json();

console.log(thaiWaterData.data);

thaiWaterData.data.forEach(station => {
    const province = station.geocode?.province_name?.en;

    if (province !== "Songkhla") {
        return;
    }

    const rain = Number(station.rain_24h) || 0;
    const lat = station.station?.tele_station_lat;
    const lon = station.station?.tele_station_long;
    const name =
        station.station?.tele_station_name?.en || "Unknown station";
    const code =
        station.station?.tele_station_oldcode || "Unknown";
    const time =
        station.rainfall_datetime || "Unknown";

    if (lat == null || lon == null) {
        return;
    }

    let color = Cesium.Color.BLUE;

    if (rain >= 40) {
        color = Cesium.Color.RED;
    } else if (rain >= 10) {
        color = Cesium.Color.ORANGE;
    } else if (rain >= 1) {
        color = Cesium.Color.CYAN;
    }

    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 800),

        point: {
            pixelSize: 24,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 4,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        },

        description: `
            <h3>${name}</h3>
            <p><b>Station Code:</b> ${code}</p>
            <p><b>24h Rainfall:</b> ${rain} mm</p>
            <p><b>Updated:</b> ${time}</p>
        `
    });
});
      


    // -----------------------------
    // WATER LEVEL STATIONS
    // -----------------------------
    // -----------------------------
// WATER LEVEL STATIONS
// -----------------------------
const waterResponse = await fetch(
    "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load"
);

const waterData = await waterResponse.json();

const waterLevel = new Cesium.CustomDataSource("Live Water Level");

viewer.dataSources.add(waterLevel);

waterData.waterlevel_data.data.forEach(station => {
    const province = station.geocode?.province_name?.en;

    if (province !== "Songkhla") {
        return;
    }

    const level = Number(station.waterlevel_msl);

    const lat = station.station?.tele_station_lat;
    const lon = station.station?.tele_station_long;

    const name =
        station.station?.tele_station_name?.en || "Unknown station";

    const code =
        station.station?.tele_station_oldcode || "Unknown";

    const time =
        station.waterlevel_datetime || "Unknown";

    if (
        lat == null ||
        lon == null ||
        station.waterlevel_msl == null
    ) {
        return;
    }

const diffBank = Number(station.diff_wl_bank);

let color = Cesium.Color.YELLOW;

if (!Number.isNaN(diffBank)) {
    if (diffBank <= 0) {
        color = Cesium.Color.RED;
    } else if (diffBank <= 1) {
        color = Cesium.Color.ORANGE;
    }
}

    waterLevel.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
            lon,
            lat,
            1200
        ),

        properties: {
            water_level_msl: level,
            station_code: code,
            station_name: name,
            time: time
        },

        point: {
            pixelSize: 28,
            color: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 4,
            disableDepthTestDistance:
                Number.POSITIVE_INFINITY
        },

        description: `
            <h3>${name}</h3>
            <p><b>Station Code:</b> ${code}</p>
            <p><b>Water Level:</b> ${level} m MSL</p>
            <p><b>Updated:</b> ${time}</p>
        `
    });
});

    // -----------------------------
    // TURF.JS DYNAMIC FLOOD EXTENT
    // -----------------------------
    let dynamicFloodLayer = null;

    async function generateDynamicFloodExtent() {
        if (dynamicFloodLayer) {
            viewer.dataSources.remove(dynamicFloodLayer);
        }

        const floodFeatures = [];

        waterLevel.entities.values.forEach(entity => {
            const level =
                Number(entity.properties?.water_level_msl?.getValue()) || 0;

            // Trigger condition for prototype flood extent
            if (level >= 2) {
                const position =
                    entity.position.getValue(Cesium.JulianDate.now());

                const cartographic =
                    Cesium.Cartographic.fromCartesian(position);

                const lon =
                    Cesium.Math.toDegrees(cartographic.longitude);

                const lat =
                    Cesium.Math.toDegrees(cartographic.latitude);

                const bufferDistance = level >= 10 ? 3 : 1.5;

                const stationPoint = turf.point([lon, lat], {
                    water_level_msl: level
                });

                const bufferedFlood = turf.buffer(
                    stationPoint,
                    bufferDistance,
                    { units: "kilometers" }
                );

                floodFeatures.push(bufferedFlood);
            }
        });

        const floodCollection = turf.featureCollection(floodFeatures);

        dynamicFloodLayer = await Cesium.GeoJsonDataSource.load(
            floodCollection,
            {
                stroke: Cesium.Color.CYAN,
                fill: Cesium.Color.CYAN.withAlpha(0.4),
                strokeWidth: 3
            }
        );

        viewer.dataSources.add(dynamicFloodLayer);
    }

    document
        .getElementById("generateFloodBtn")
        .addEventListener("click", generateDynamicFloodExtent);

    document
        .getElementById("clearFloodBtn")
        .addEventListener("click", () => {
            if (dynamicFloodLayer) {
                viewer.dataSources.remove(dynamicFloodLayer);
                dynamicFloodLayer = null;
            }
        });
}

main();

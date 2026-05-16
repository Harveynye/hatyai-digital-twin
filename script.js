Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZGFkZDA5NS1lYmQxLTRlYmYtYTgxZC0xYTNiNzU4NTRmNDciLCJpZCI6MzI0NjE4LCJpYXQiOjE3NTMzMzgxNDd9.v1Zu9SQtxcFklATKFLRzHuJEnkw_FfVGLf0Kmel_0Yg";

async function main() {

    const viewer = new Cesium.Viewer("cesiumContainer", {

        terrain: Cesium.Terrain.fromWorldTerrain(),

        animation: true,
        timeline: true,
        terrainShadows: Cesium.ShadowMode.ENABLED
    });

    viewer.scene.globe.depthtestAgainstTerrain = false;
function liftPointAboveGround(entity, height = 500) {
    const position = entity.position.getValue(Cesium.JulianDate.now());
    const cartographic = Cesium.Cartographic.fromCartesian(position);

    const lon = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);

    entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
}
    // Fly to Hat Yai

    viewer.camera.flyTo({

        destination: Cesium.Cartesian3.fromDegrees(
            100.4747,
            7.0084,
            70000
        )
    });

    // Add OSM Buildings

    const buildings = await Cesium.createOsmBuildingsAsync();

    viewer.scene.primitives.add(buildings);

    // -----------------------------
    // FLOOD RISK
    // -----------------------------

    const floodRisk = await Cesium.GeoJsonDataSource.load(
        "flood_risk_simplified.geojson",
        {

            stroke: Cesium.Color.RED,

            fill: Cesium.Color.RED.withAlpha(0.5
            ),

            strokeWidth: 0
        }
    );

    viewer.dataSources.add(floodRisk);

    // -----------------------------
    // RAINFALL
    // -----------------------------

    const rainfall = await Cesium.GeoJsonDataSource.load(
        "rainfall.gson.geojson"
    );

    viewer.dataSources.add(rainfall);

    rainfall.entities.values.forEach(entity => {

        const rain =
            Number(entity.properties?.rain_24h?.getValue()) || 0;

        let color = Cesium.Color.BLUE;

        if (rain >= 40) {

            color = Cesium.Color.RED;

        } else if (rain >= 10) {

            color = Cesium.Color.ORANGE;

        } else if (rain >= 1) {

            color = Cesium.Color.CYAN;
        }

        entity.billboard = undefined;

        liftPointAboveGround(entity, 800);

        entity.point = new Cesium.PointGraphics({

            pixelSize: 24,

            color: color,

            outlineColor: Cesium.Color.WHITE,

            outlineWidth: 4,
            
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        });

        entity.description = `
            <h3>Rainfall Station</h3>
            <p><b>24h Rainfall:</b> ${rain} mm</p>
        `;
    });

    // -----------------------------
    // WATER LEVEL
    // -----------------------------

    const waterLevel = await Cesium.GeoJsonDataSource.load(
        "flood.json.geojson"
    );

    viewer.dataSources.add(waterLevel);

    waterLevel.entities.values.forEach(entity => {

        const level =
            Number(entity.properties?.water_level_msl?.getValue()) || 0;

        let color = Cesium.Color.YELLOW;

        if (level >= 10) {

            color = Cesium.Color.RED;

        } else if (level >= 5) {

            color = Cesium.Color.ORANGE;
        }

        entity.billboard = undefined;

        liftPointAboveGround(entity, 1200);

        entity.point = new Cesium.PointGraphics({

            pixelSize: 28,

            color: color,

            outlineColor: Cesium.Color.BLACK,

            outlineWidth: 4,

            disableDepthTestDistance: Number.POSITIVE_INFINITY
        });

        entity.description = `
            <h3>Water Level Station</h3>
            <p><b>Water Level:</b> ${level} m MSL</p>
        `;
    });

}

main();
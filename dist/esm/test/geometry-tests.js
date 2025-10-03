import assert from "assert";
import test from 'node:test';
import { Geometry } from '../src/geometry';
test('2args', async () => {
    const geom = new Geometry("Point", [0, 1]);
    assert.equal(geom.type, "Point");
    assert.equal(geom.coordinates.length, 2);
    assert.equal(geom.coordinates[0], 0);
    assert.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
});
test('2argsBoxStr', async () => {
    const geom = new Geometry("BOX", "0,1");
    assert.equal(geom.type, "Point");
    assert.equal(geom.coordinates.length, 2);
    for (const dim of geom.coordinates) {
        assert.equal(typeof dim, "number");
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Point");
});
test('2argsBoxStrPolygon', async () => {
    const geom = new Geometry("BOX", "0,1,2,3");
    assert.equal(geom.type, "Polygon");
    assert.equal(geom.coordinates.length, 1);
    assert(Array.isArray(geom.coordinates[0]));
    assert.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Polygon");
    assert.equal(geojson.geometry.coordinates.length, 1);
    assert(Array.isArray(geojson.geometry.coordinates[0]));
    assert.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
});
test('2argsBoxArrayPolygon', async () => {
    const geom = new Geometry("BOX", [0, 1, 2, 3]);
    assert.equal(geom.type, "Polygon");
    assert.equal(geom.coordinates.length, 1);
    assert(Array.isArray(geom.coordinates[0]));
    assert.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Polygon");
    assert.equal(geojson.geometry.coordinates.length, 1);
    assert(Array.isArray(geojson.geometry.coordinates[0]));
    assert.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
});
test('2argsPolygon', async () => {
    const geom = new Geometry("Polygon", [[[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]]);
    assert.equal(geom.type, "Polygon");
    assert.equal(geom.coordinates.length, 1);
    assert(Array.isArray(geom.coordinates[0]));
    assert.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Polygon");
    assert.equal(geojson.geometry.coordinates.length, 1);
    assert(Array.isArray(geojson.geometry.coordinates[0]));
    assert.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});
test('wktPolygon', async () => {
    const geom = new Geometry("POLYGON((0 1,0 3,2 3,2 1,0 1))");
    assert.equal(geom.type, "Polygon");
    assert.equal(geom.coordinates.length, 1);
    assert(Array.isArray(geom.coordinates[0]));
    assert.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Polygon");
    assert.equal(geojson.geometry.coordinates.length, 1);
    assert(Array.isArray(geojson.geometry.coordinates[0]));
    assert.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});
test('wktpoint', async () => {
    const geom = new Geometry("POINT(0 1)");
    assert.equal(geom.type, "Point");
    assert.equal(geom.coordinates.length, 2);
    assert.equal(geom.coordinates[0], 0);
    assert.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Point");
    assert.equal(geojson.geometry.coordinates.length, 2);
    assert.equal(geojson.geometry.coordinates[0], 0);
    assert.equal(geojson.geometry.coordinates[1], 1);
    const geomstr = geom.toString();
    assert.equal(geomstr, "POINT(0 1)");
});
test('geometryDictPoint', async () => {
    const geom = new Geometry({ type: "Point", coordinates: [0, 1] });
    assert.equal(geom.type, "Point");
    assert.equal(geom.coordinates.length, 2);
    assert.equal(geom.coordinates[0], 0);
    assert.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Point");
    assert.equal(geojson.geometry.coordinates.length, 2);
    assert.equal(geojson.geometry.coordinates[0], 0);
    assert.equal(geojson.geometry.coordinates[1], 1);
    const geomstr = geom.toString();
    assert.equal(geomstr, "POINT(0 1)");
});
test('geometryDictPolygon', async () => {
    const geom = new Geometry({ type: "Polygon", coordinates: [[[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]] });
    assert.equal(geom.type, "Polygon");
    assert.equal(geom.coordinates.length, 1);
    assert(Array.isArray(geom.coordinates[0]));
    assert.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    assert("geometry" in geojson);
    assert.equal(geojson.geometry.type, "Polygon");
    assert.equal(geojson.geometry.coordinates.length, 1);
    assert(Array.isArray(geojson.geometry.coordinates[0]));
    assert.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        assert(Array.isArray(position));
        assert.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});

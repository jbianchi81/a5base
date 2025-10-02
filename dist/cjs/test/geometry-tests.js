"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const test = require('node:test');
const geometry_1 = __importDefault(require("../src/geometry"));
test('2args', async () => {
    const geom = new geometry_1.default("Point", [0, 1]);
    assert_1.default.equal(geom.type, "Point");
    assert_1.default.equal(geom.coordinates.length, 2);
    assert_1.default.equal(geom.coordinates[0], 0);
    assert_1.default.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
});
test('2argsBoxStr', async () => {
    const geom = new geometry_1.default("BOX", "0,1");
    assert_1.default.equal(geom.type, "Point");
    assert_1.default.equal(geom.coordinates.length, 2);
    for (const dim of geom.coordinates) {
        assert_1.default.equal(typeof dim, "number");
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Point");
});
test('2argsBoxStrPolygon', async () => {
    const geom = new geometry_1.default("BOX", "0,1,2,3");
    assert_1.default.equal(geom.type, "Polygon");
    assert_1.default.equal(geom.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geom.coordinates[0]));
    assert_1.default.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Polygon");
    assert_1.default.equal(geojson.geometry.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geojson.geometry.coordinates[0]));
    assert_1.default.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
});
test('2argsBoxArrayPolygon', async () => {
    const geom = new geometry_1.default("BOX", [0, 1, 2, 3]);
    assert_1.default.equal(geom.type, "Polygon");
    assert_1.default.equal(geom.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geom.coordinates[0]));
    assert_1.default.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Polygon");
    assert_1.default.equal(geojson.geometry.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geojson.geometry.coordinates[0]));
    assert_1.default.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
});
test('2argsPolygon', async () => {
    const geom = new geometry_1.default("Polygon", [[[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]]);
    assert_1.default.equal(geom.type, "Polygon");
    assert_1.default.equal(geom.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geom.coordinates[0]));
    assert_1.default.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Polygon");
    assert_1.default.equal(geojson.geometry.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geojson.geometry.coordinates[0]));
    assert_1.default.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert_1.default.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});
test('wktPolygon', async () => {
    const geom = new geometry_1.default("POLYGON((0 1,0 3,2 3,2 1,0 1))");
    assert_1.default.equal(geom.type, "Polygon");
    assert_1.default.equal(geom.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geom.coordinates[0]));
    assert_1.default.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Polygon");
    assert_1.default.equal(geojson.geometry.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geojson.geometry.coordinates[0]));
    assert_1.default.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert_1.default.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});
test('wktpoint', async () => {
    const geom = new geometry_1.default("POINT(0 1)");
    assert_1.default.equal(geom.type, "Point");
    assert_1.default.equal(geom.coordinates.length, 2);
    assert_1.default.equal(geom.coordinates[0], 0);
    assert_1.default.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Point");
    assert_1.default.equal(geojson.geometry.coordinates.length, 2);
    assert_1.default.equal(geojson.geometry.coordinates[0], 0);
    assert_1.default.equal(geojson.geometry.coordinates[1], 1);
    const geomstr = geom.toString();
    assert_1.default.equal(geomstr, "POINT(0 1)");
});
test('geometryDictPoint', async () => {
    const geom = new geometry_1.default({ type: "Point", coordinates: [0, 1] });
    assert_1.default.equal(geom.type, "Point");
    assert_1.default.equal(geom.coordinates.length, 2);
    assert_1.default.equal(geom.coordinates[0], 0);
    assert_1.default.equal(geom.coordinates[1], 1);
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Point");
    assert_1.default.equal(geojson.geometry.coordinates.length, 2);
    assert_1.default.equal(geojson.geometry.coordinates[0], 0);
    assert_1.default.equal(geojson.geometry.coordinates[1], 1);
    const geomstr = geom.toString();
    assert_1.default.equal(geomstr, "POINT(0 1)");
});
test('geometryDictPolygon', async () => {
    const geom = new geometry_1.default({ type: "Polygon", coordinates: [[[0, 1], [0, 3], [2, 3], [2, 1], [0, 1]]] });
    assert_1.default.equal(geom.type, "Polygon");
    assert_1.default.equal(geom.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geom.coordinates[0]));
    assert_1.default.equal(geom.coordinates[0].length, 5);
    for (const position of geom.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geojson = geom.toGeoJSON();
    (0, assert_1.default)("geometry" in geojson);
    assert_1.default.equal(geojson.geometry.type, "Polygon");
    assert_1.default.equal(geojson.geometry.coordinates.length, 1);
    (0, assert_1.default)(Array.isArray(geojson.geometry.coordinates[0]));
    assert_1.default.equal(geojson.geometry.coordinates[0].length, 5);
    for (const position of geojson.geometry.coordinates[0]) {
        (0, assert_1.default)(Array.isArray(position));
        assert_1.default.equal(position.length, 2);
    }
    const geomstr = geom.toString();
    assert_1.default.equal(geomstr, "POLYGON((0 1,0 3,2 3,2 1,0 1))");
});

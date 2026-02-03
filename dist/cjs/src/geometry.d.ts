import { Point, Polygon, Position } from 'geojson';
export interface PointGeometry {
    type: "Point";
    coordinates: Position;
}
export interface MultiPointGeometry {
    type: "MultiPoint";
    coordinates: Position[];
}
export interface LineStringGeometry {
    type: "LineString";
    coordinates: Position[];
}
export interface MultiLineStringGeometry {
    type: "MultiLineString";
    coordinates: Position[][];
}
export interface PolygonGeometry {
    type: "Polygon";
    coordinates: Position[][];
}
export interface MultiPolygonGeometry {
    type: "MultiPolygon";
    coordinates: Position[][][];
}
export interface GeometryCollection {
    type: "GeometryCollection";
    geometries: GeometryDict[];
}
/** All valid GeoJSON geometries */
export type GeometryDict = PointGeometry | MultiPointGeometry | LineStringGeometry | MultiLineStringGeometry | PolygonGeometry | MultiPolygonGeometry;
export declare class Geometry {
    type: "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon";
    coordinates: Position | Position[] | Position[][] | Position[][][];
    constructor(type: "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon", coordinates: Position | Position[] | Position[][] | Position[][][]);
    constructor(type: "BOX", coordinates: number[]);
    constructor(type: "BOX", coordinates: string);
    constructor(wkt: string);
    constructor(arg1: GeometryDict);
    getGeom(): Point | Polygon;
    toString(): any;
    toCSV(): any;
    toSQL(): string | null;
    toGeoJSON(properties?: any): import("geojson").Feature<Point | Polygon, any>;
    bbox(): import("geojson").BBox;
}

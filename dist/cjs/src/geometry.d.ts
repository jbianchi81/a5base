import { Point, Polygon, Position } from 'geojson';
export interface GeometryDict {
    type: "Point" | "Polygon";
    coordinates: Position | Position[][];
}
export declare class Geometry {
    type: "Point" | "Polygon";
    coordinates: Position | Position[][];
    constructor(type: "Point" | "Polygon", coordinates: Position | Position[][]);
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

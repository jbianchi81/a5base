import { Point, Polygon, Position } from 'geojson';
export default class Geometry {
    type: "Point" | "Polygon";
    coordinates: Position | Position[][] | string;
    constructor(args: string | any[]);
    getGeom(): Point | Polygon;
    toString(): any;
    toCSV(): any;
    toSQL(): string | null;
    toGeoJSON(properties?: any): import("geojson").Feature<Point | Polygon, any>;
    bbox(): import("geojson").BBox;
}

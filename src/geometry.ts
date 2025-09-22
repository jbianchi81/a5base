import Wkt from 'wicket';
const wkt = new Wkt.Wkt();

import bbox from '@turf/bbox';
import * as turfHelpers from '@turf/helpers';

import geojsonValidation from 'geojson-validation';
import { Point, Polygon, MultiPolygon, Position } from 'geojson'

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === "number");
}

function isArrayOfNumberArray(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every(item => isNumberArray(typeof item === "number"));
}

function isArrayOfArrayOfNumberArray(value: unknown): value is number[][][] {
  return Array.isArray(value) && value.every(item => isArrayOfNumberArray(typeof item === "number"));
}


export default class Geometry {

    type : "Point" | "Polygon"
    coordinates : Position | Position[][] | string
	constructor(args: string | any[]) {
        // super()
		// console.log(JSON.stringify({geom_arguments:arguments}))
		switch(args.length) {
			case 1:
				if(typeof(args[0]) === "string") {   // WKT
					// if(config.verbose) {
					// 	console.log("reading wkt string geometry")
					// }
					try {
						var geom = wkt.read(args[0]).toJson()
					} catch(e) {
						throw new Error(e as string)
					}
					this.type = geom.type
					this.coordinates = geom.coordinates
				} else {
					this.type = args[0].type
					this.coordinates = args[0].coordinates
				}
				break;
			default:
				this.type = args[0]
				this.coordinates = args[1]
				break;
		}
		if(!this.type) {
			throw new Error("Invalid geometry: missing type")
		}
		if(!this.coordinates) {
			throw new Error("Invalid geometry: missing coordinates")
		}
		
		if(this.type.toUpperCase() == "BOX") {
			this.type = "Polygon"
			var coords = Array.isArray(this.coordinates) ? this.coordinates : this.coordinates.split(",").map(c=>parseFloat(c))
            if (isNumberArray(coords)) {                
                if(coords.length<2) {
                    console.error("Bad bounding box: missing coordinates")
                    throw new Error("Bad bounding box: missing coordinates")
                } 
                const coordsDefined: number[] = coords.map((n) => {
                    if (typeof n !== "number" || Number.isNaN(n)) {
                        throw new Error("Bad bounding box: NaN or undefined found in coordinates");
                    }
                    return n;
                });
                if(coordsDefined.length == 2) {
                    const [x, y] = coordsDefined
                    if([x, y].some(n => n === undefined)) {
                        throw new Error("Bad bounding box: NaN or undefined found in coordinates")
                    }
                    this.type = "Point"
                    this.coordinates = [ x!, y! ]
                } else {
                    const [x1, y1, x2, y2] = coordsDefined
                    if([x1, y1, x2, y2].some(n => n === undefined)) {
                        throw new Error("Bad bounding box: NaN or undefined found in coordinates")
                    }
                    this.coordinates =  [ [ [ x1!, y1! ], [ x1!, y2! ], [ x2!, y2! ], [ x2!, y1! ], [ x1!, y1! ] ] ]
                }
            } else {
                throw new Error("Bad bounding box: must be an array of numbers")
            }
			// console.log(JSON.stringify(this))
		} 
		if(!geojsonValidation.isGeometryObject({type: capitalize_initial(this.type), coordinates: this.coordinates})) {
			throw new Error("Invalid geometry")
		}

	}
    getGeom() : Point | Polygon {
        const coords = this.coordinates
        if(coords instanceof String) {
            throw new Error("Coordinates must be parsed before converting")
        }
        if(this.type == "Point") {
            if(!isNumberArray(coords)) {
                throw new Error("Invalid coordinates dimensions for Point geometry")
            }
            return {
                type: "Point",
                coordinates: coords
            } as Point
        }
        else if(this.type == "Polygon") {
            if(!isArrayOfArrayOfNumberArray(coords)) {
                throw new Error("Invalid coordinates dimensions for MultiPolygon geometry")
            }
            return {
                type: this.type,
                coordinates: coords
            } as Polygon
        } else {
            throw new Error("Invalid geometry type")
        }
    }

	toString() {  // WKT
		return wkt.fromObject(this).write()
	}
	toCSV() {
		return wkt.fromObject(this).write() // this.type + "," + this.coordinates.join(",")
	}
	toSQL() {
        const coords = this.coordinates
        if(!Array.isArray(coords)) {
            throw new Error("Must parse coordinates string before converting to SQL")
        }
		//~ return "ST_GeomFromText('" + this.toString() + "', 4326)"
		if(this.type.toUpperCase() == "POINT") {
			return "ST_SetSRID(ST_Point(" + coords.join(",") + "),4326)"
		} else if (this.type.toUpperCase() == "POLYGON") {
            if(!isArrayOfArrayOfNumberArray(coords)) {
                throw("Invalid coordinates for type Polygon")
            }
			//return "st_geomfromtext('" + this.toString()+ "',4326)" 
			//  "ST_Polygon('LINESTRING(" + this.coordinates.map(it=> it.join(" ")).join(",") + ")'::geometry,4326)"
			return "st_geomfromtext('POLYGON((" + coords.map(p=> p.join(" ")).join(",")+ "))',4326)"
		} else if (this.type.toUpperCase() == "LINESTRING") {
            if(!isArrayOfArrayOfNumberArray(coords)) {
                throw("Invalid coordinates for type Linestring")
            }
			//~ return "st_geomfromtext('" + this.toString()+ "',4326)" // "ST_GeomFromText('LINESTRING(" + this.coordinates.map(it=> it.join(" ")).join(",") + ")',4326)"
			return "st_geomfromtext('LINESTRING((" + coords.map(p=> p.join(" ")).join(",")+ "))',4326)"
		} else {
			console.error("Unknown geometry type")
			return null
		}
	}
	toGeoJSON(properties? : any) {
		return turfHelpers.feature(this.getGeom(),properties)
	}
	// distance(feature) {
	// 	if(feature instanceof Geometry) {
	// 		feature = feature.toGeoJSON()
	// 	}
	// 	if(this.type != "Point" || feature.geometry.type != "Point") {
	// 		console.error("distance only works for points")
	// 		return
	// 	}
	// 	return this.distance(feature,this.toGeoJSON(),{units:"kilometers"})
	// }
	bbox() {
		// bbox extent in [minX, minY, maxX, maxY] order
		const geom = this.toGeoJSON()
		return bbox(geom)
	}
}

function capitalize_initial(str : string) {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}
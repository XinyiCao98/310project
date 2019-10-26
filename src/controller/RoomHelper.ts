import {InsightError} from "./IInsightFacade";
import * as fs from "fs";
import Log from "../Util";
import * as JSZip from "jszip";

export default class RoomHelper {

    constructor() {
        //
    }

    public addRoom(id: string, content: string, currZip: JSZip, datasetMap: Map<string, any[]>,
                   datasetId: string[]): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let buildingMap: Map<string, any> = new Map<string, any>();
            let validRoom: any[] = [];
            let urlList: Array<Promise<string>> = [];
            const that = this;
            const parse5 = require("parse5");
            currZip.loadAsync(content, {base64: true}).then(async function (zip: any) {
                try {
                    const idx = await zip.folder("rooms").file("index.htm").async("text");
                    const indexTree = parse5.parse(idx);
                    const buildingList = that.getInside(indexTree.childNodes);
                    if (buildingList !== null && buildingList !== undefined) {
                        buildingMap = that.getBuildingInfo(buildingList);
                    }
                    // await that.waitGeo(buildingMap);
                    for (let singleBuilding of buildingMap.values()) {
                        await that.getGeoInfo(singleBuilding).catch((e: any) => {
                            // return reject(new InsightError("Every room should have a geoLocation"));
                        });
                    }
                    for (let build of buildingMap.values()) {
                        let path = build["buildingHref"].substring(2); // 取地址
                        urlList.push(zip.folder("rooms").file(path).async("text"));
                    }
                    Promise.all(urlList).then((ele: any) => {
                        validRoom = that.gatherValid(ele, buildingMap, id);
                        if (validRoom.length === 0) {
                            return reject(new InsightError("There is no valid room"));
                        } else {
                            try {
                                that.writeToDisk(validRoom, id);
                                datasetId.push(id);
                                datasetMap.set(id, validRoom);
                                fulfill(datasetId);
                            } catch (e) {
                                return reject(new InsightError("Fail to write to disk"));
                            }
                        }
                    });
                } catch (e) {
                    return reject(new InsightError("ALl kinds of errors inside try"));
                }
            }).catch((e: any) => {
                return reject(new InsightError("This is not a htm"));
            });
        });
    }

    public gatherValid(ele: any, buildingMap: Map<string, any>, id: string): any[] {
        try {
            const parse5 = require("parse5");
            let validRoom: any[] = [];
            for (let source of ele) {
                let eachBuilding = parse5.parse(source);
                let roomList = this.getInside(eachBuilding.childNodes);
                if (roomList === null || roomList === undefined) {
                    continue;
                }
                for (let roomNode of roomList) {
                    if (roomNode === null || roomNode === undefined) {
                        continue;
                    }
                    if (roomNode.nodeName !== "tr"
                        || roomNode.childNodes === undefined || roomNode.childNodes === null) {
                        continue;
                    }
                    let childList = roomNode.childNodes;
                    let rooms = this.getRoomInfo(childList);
                    let href = rooms["roomHref"];
                    let l = href.lastIndexOf("/");
                    let building;
                    let bsName = href.substring(l + 1).split("-")[0];
                    if (buildingMap.has(bsName)) {
                        building = buildingMap.get(bsName);
                        rooms["roomName"] = building["buildingShort"] + "_" + rooms["roomNumber"];
                    } else {
                        continue;
                    }
                    if (this.checkCondition(building, rooms, buildingMap, id) !== null) {
                        validRoom.push(this.checkCondition(building, rooms, buildingMap, id));
                    }
                }
            }
            return validRoom;
        } catch (e) {
            //
        }
    }

    public checkCondition(building: any, rooms: any, buildingMap: Map<string, any>, id: string): any {
        if (typeof building["buildingFull"] === "string" &&
            typeof building["buildingShort"] === "string" &&
            typeof building["buildingAdr"] === "string" &&
            typeof building["buildingHref"] === "string" &&
            typeof building["buildingLat"] === "number" &&
            building["buildingLat"] !== 0 &&
            building["buildingLon"] !== 0 &&
            typeof building["buildingLon"] === "number" &&
            typeof rooms["roomNumber"] === "string" && typeof rooms["roomName"] === "string" &&
            typeof rooms["roomSeats"] === "number" && typeof rooms["roomType"] === "string" &&
            typeof rooms["roomFurniture"] === "string" && typeof rooms["roomHref"] === "string") {
            let validSingleRoom: { [k: string]: number | string } = {
                [id + "_fullname"]: building["buildingFull"], [id + "_shortname"]: building["buildingShort"],
                [id + "_number"]: rooms["roomNumber"], [id + "_name"]: rooms["roomName"],
                [id + "_address"]: building["buildingAdr"], [id + "_lat"]: building["buildingLat"],
                [id + "_lon"]: building["buildingLon"], [id + "_seats"]: rooms["roomSeats"],
                [id + "_type"]: rooms["roomType"], [id + "_furniture"]: rooms["roomFurniture"],
                [id + "_href"]: building["buildingHref"],
            };
            return validSingleRoom;
        } else {
            return null;
        }
    }

    public writeToDisk(validRoom: any, id: string): boolean {
        fs.writeFile("./data/" + id + ".json",
            JSON.stringify(validRoom, null, " "), (e) => {
                if (e !== null) {
                    return false;
                }
            });
        return true;
    }

    public getRoomInfo(childList: any[]): any {
        let roomNumber: string = "";
        let roomName: string = "";
        let roomSeats: number = 0;
        let roomType: string = "";
        let roomFurniture: string = "";
        let roomHref: string = "";
        for (let eachChild of childList) {
            if (eachChild.nodeName === "td" && eachChild.attrs[0].name === "class") {
                let value = eachChild.attrs[0].value.trim();
                if (value === "views-field views-field-field-room-number") {
                    roomNumber = eachChild.childNodes[1].childNodes[0].value.trim();
                    if (eachChild.childNodes[1].attrs[0].name === "href") {
                        roomHref = eachChild.childNodes[1].attrs[0].value;
                    }
                } else if (value === "views-field views-field-field-room-capacity") {
                    roomSeats = parseInt(eachChild.childNodes[0].value, 10);
                } else if (value === "views-field views-field-field-room-furniture") {
                    roomFurniture = eachChild.childNodes[0].value.trim();
                } else if (value === "views-field views-field-field-room-type") {
                    roomType = eachChild.childNodes[0].value.trim();
                }
            }
        }
        let roomList: { [k: string]: number | string } = {
            ["roomNumber"]: roomNumber,
            ["roomName"]: roomName,
            ["roomSeats"]: roomSeats,
            ["roomType"]: roomType,
            ["roomFurniture"]: roomFurniture,
            ["roomHref"]: roomHref
        };
        return roomList;
    }

    public async getGeoInfo(buildingList: any): Promise<any> {
        return new Promise((fulfill, reject) => {
            let address = buildingList["buildingAdr"];
            address = this.transAdr(address);
            let link = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team054/" + address;
            let http = require("http");
            http.get(link, (response: any) => {
                response.setEncoding("utf8");
                let result = "";
                response.on("data", function (chunk: any) {
                    result += chunk;
                });
                response.on("end", function () {
                    try {
                        const afterParse: any = JSON.parse(result);
                        if (afterParse.hasOwnProperty("lat") && afterParse.hasOwnProperty("lon")) {
                            buildingList["buildingLat"] = afterParse.lat;
                            buildingList["buildingLon"] = afterParse.lon;
                            return fulfill(buildingList);
                        } else if (afterParse.hasOwnProperty("error")) {
                            return reject(new InsightError("no lat lon"));
                        }
                    } catch (e) {
                        return reject("not able to parse");
                    }
                });
                response.on("error", function (e: any) {
                    Log.trace("fail to encode");
                });
            });
        });
    }

    public transAdr(address: string): string {
        address = address.split(" ").join("%20");
        return address.trim();
    }

    public getBuildingInfo(buildingNodes: any[]): any {
        let buildingMap: Map<string, any> = new Map<string, any>();
        // if (buildingNodes === undefined || buildingNodes === null) {
        //     return buildingMap;
        // }
        for (let singleB of buildingNodes) {
            if (singleB.nodeName !== "tr") {
                continue;
            }
            let buildingFull: string = "";
            let buildingShort: string = "";
            let buildingAdr: string = "";
            let buildingHref: string = "";
            let buildingLat: number = 0;
            let buildingLon: number = 0;
            if (singleB.childNodes === undefined || singleB.childNodes === null) {
                continue;
            }
            for (let singleN of singleB.childNodes) {
                if (singleN.attrs !== null && singleN.attrs !== undefined &&
                    singleN.nodeName === "td" && singleN.attrs[0].name === "class") {
                    if (singleN.attrs[0].value === "views-field views-field-title") {
                        buildingHref = singleN.childNodes[1].attrs[0].value;
                        buildingFull = singleN.childNodes[1].childNodes[0].value.trim();
                    } else if (singleN.attrs[0].value === "views-field views-field-field-building-code") {
                        buildingShort = singleN.childNodes[0].value.trim();
                    } else if (singleN.attrs[0].value === "views-field views-field-field-building-address") {
                        buildingAdr = singleN.childNodes[0].value.trim();
                    }
                }
            }
            let buildingList: { [k: string]: number | string } = {
                ["buildingFull"]: buildingFull,
                ["buildingShort"]: buildingShort,
                ["buildingAdr"]: buildingAdr,
                ["buildingHref"]: buildingHref,
                ["buildingLat"]: buildingLat,
                ["buildingLon"]: buildingLon
            };
            buildingMap.set(buildingShort, buildingList);
        }
        return buildingMap;
    }

    public getInside(nodes: any[]): any[] {
        let bodyObj: any[] = [];
        if (nodes === undefined || nodes === null) {
            return bodyObj;
        } else {
            for (let node of nodes) {
                if (node.nodeName === "tbody") {
                    for (let child of node.childNodes) {
                        bodyObj.push(child);
                    }
                    return bodyObj;
                } else {
                    bodyObj = this.getInside(node.childNodes);
                    if (bodyObj.length !== 0) {
                        return bodyObj;
                    }
                }
            }
            return bodyObj;
        }
    }
}

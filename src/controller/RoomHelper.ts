import {InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";

export default class RoomHelper {

    constructor() {
        //
    }

    public addRoom(id: string, content: string, currZip: JSZip, datasetMap: Map<string, any[]>,
                   datasetId: string[]): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let buildingMap: Map<string, any> = new Map<string, any>();
            let validRoom: any[] = [];
            const promiseArray: Array<Promise<string>> = [];
            const that = this;
            const parse5 = require("parse5");
            currZip.loadAsync(content, {base64: true}).then(function (zip: any) {
                zip.file("index.htm").async("text").then(async (htmFile: any) => {
                    try {
                        let indexTree = parse5.parse(htmFile);
                        const buildingList = that.getInside(indexTree.childNodes);
                        buildingMap = that.getBuildingInfo(buildingList); // TODO: 判空？
                        for (let singleBuilding of buildingMap.values()) {
                            await that.getGeoInfo(singleBuilding);
                            const path = singleBuilding["buildingHref"].substring(2); // 取地址
                            promiseArray.push(singleBuilding.file(path).async("text")); // TODO
                        }
                        Promise.all(promiseArray).then((ele: any) => {
                            for (let source of ele) {
                                try {
                                    let eachBuilding = parse5.parse(source);
                                    validRoom = that.getSpecificRoom(eachBuilding, buildingMap, id);
                                    if (validRoom.length === 0) {
                                        return reject(new InsightError("There is no valid room"));
                                    } else {
                                        fs.writeFile("./data/" + id + ".json",
                                            JSON.stringify(validRoom, null, " "), (e) => {
                                                if (e !== null) {
                                                    reject(new InsightError("Error occurs when saving the room"));
                                                }
                                            });
                                        datasetId.push(id);
                                        datasetMap.set(id, validRoom);
                                        fulfill(datasetId);
                                    }
                                } catch (e) {
                                    return reject(new InsightError("Fail to write"));
                                }
                            }
                        });
                    } catch (e) {
                        return reject(new InsightError("ALl kinds of errors inside try"));
                    }
                });
            }).catch(function (e) {
                reject(new InsightError("This is not a htm"));
            });
        });
    }

    public getSpecificRoom(eachBuilding: any, buildingMap: Map<string, any>, id: string): any[] {
        try {
            const roomList = this.getInside(eachBuilding.childNodes);
            if (roomList === null || roomList === undefined) {
                return roomList;
            }
            let validRoom: any[] = [];
            for (let roomNode of roomList) {
                if (roomNode.nodeName === "tr"
                    && roomNode.childNodes !== undefined && roomNode.childNodes !== null) {
                    let childList = roomNode.childNodes;
                    let rooms = this.getRoomInfo(childList);
                    let l = rooms["roomHref"].lastIndexof("/");
                    let building;
                    let bsName = rooms["roomHref"].substring(l + 1).split("-")[0];
                    if (buildingMap.has(bsName)) {
                        building = buildingMap.get(bsName);
                        rooms["roomName"] = bsName + "_" + rooms["roomNumber"];
                    }
                    if (typeof building["buildingFull"] === "string" &&
                        typeof building["buildingShort"] === "string" &&
                        typeof building["buildingAdr"] === "string" &&
                        typeof building["buildingHref"] === "string" &&
                        typeof building["buildingLat"] === "number" &&
                        typeof building["buildingLon"] === "number" &&
                        typeof rooms["roomNumber"] === "number" &&
                        typeof rooms["roomName"] === "string" &&
                        typeof rooms["roomSeats"] === "number" && typeof rooms["roomType"] === "string" &&
                        typeof rooms["roomFurniture"] === "number" && typeof rooms["roomHref"] === "string") {
                        let validSingleRoom: { [k: string]: number | string } = {
                            [id + "_fullname"]: building["buildingFull"],
                            [id + "_shortname"]: building["buildingShort"],
                            [id + "_number"]: rooms["roomNumber"],
                            [id + "_name"]: rooms["roomName"],
                            [id + "_address"]: building["buildingAdr"],
                            [id + "_lat"]: building["buildingLat"],
                            [id + "_lon"]: building["buildingLon"],
                            [id + "_seats"]: rooms["roomSeats"],
                            [id + "_type"]: rooms["roomType"],
                            [id + "_furniture"]: rooms["roomFurniture"],
                            [id + "_href"]: building["buildingHref"],
                        };
                        validRoom.push(validSingleRoom);
                    }
                }
            }
            return validRoom;
        } catch (e) {
            //
        }
    }

    public getRoomInfo(childList: any[]): any {
        let roomNumber: string;
        let roomName: string;
        let roomSeats: number;
        let roomType: string;
        let roomFurniture: string;
        let roomHref: string;
        for (let eachChild of childList) {
            if (eachChild.nodeName === "td" && eachChild.attrs[0].name === "class") {
                let value = eachChild.attrs[0].value.trim();
                if (value === "views-field views-field-field-room-number") {
                    roomNumber = eachChild.childNodes[1].childNodes[0].value.trim();
                    if (eachChild.childNodes[1].attrs[0].name === "href") {
                        roomHref = eachChild.childNodes[1].attrs[0].value;
                    }
                } else if (value === "views-field views-field-field-room-capacity") {
                    roomSeats = eachChild.childNodes[0].value.trim();
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

    public getGeoInfo(buildingList: any): Promise<any> {
        let address = buildingList["buildingAdr"];
        address = this.transAdr(address);
        let link = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team054/" + address;
        let http = require("http");
        return new Promise((fulfill, reject) => {
            http.get(link).then((response: any) => {
                let afterParse: any = JSON.parse(response);
                if (Object.keys(afterParse).includes("error")) {
                    return reject(new InsightError("fail to get location"));
                } else {
                    buildingList["buildingLat"] = afterParse.lat;
                    buildingList["buildingLon"] = afterParse.lon;
                    return fulfill(buildingList);
                }
            }).catch((error: any) => {
                return reject("404");
            });
        });
    }

    public transAdr(address: string): string {
        address.replace(" ", "%20");
        return address;
    }

    public getBuildingInfo(buildingNodes: any): any {
        let buildingMap: Map<string, any> = new Map<string, any>();
        let buildingFull: string;
        let buildingShort: string;
        let buildingAdr: string;
        let buildingHref: string;
        let buildingLat: number;
        let buildingLon: number;
        for (let singleN of buildingNodes.childNodes) {
            if (singleN.nodeName === "td" && singleN.attrs[0].name === "class") {
                if (singleN.attrs[0].value === "views-field views-field-title") {
                    if (singleN.childNodes[1].attrs[0].name === "href") {
                        buildingHref = singleN.childNodes[1].attrs[0].value;
                    }
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
                        return bodyObj;
                    }
                } else {
                    bodyObj = this.getInside(node.childNodes);
                    if (bodyObj.length !== 0) {
                        return bodyObj;
                    }
                }
            }
        }
    }
}

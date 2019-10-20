import {InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import {rejects} from "assert";

export default class RoomHelper {

    constructor() {
        //
    }

    public addRoom(id: string, content: string, currZip: JSZip): Promise<string[]> {
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
                        const roomList = that.getInside(indexTree.childNodes);
                        if (roomList !== null && roomList !== undefined) {
                            for (let roomNode of roomList) {
                                if (roomNode.nodeName === "tr"
                                    && roomNode.childNodes !== undefined && roomNode.childNodes !== null) {
                                    let buildingList = that.getRoomInfo(roomNode.childNodes);
                                    buildingMap.set(buildingList["buildingShort"], buildingList);
                                }
                            }
                            for (let singleBuilding of buildingMap.values()) {
                                try {
                                    await that.getGeo(singleBuilding);
                                    const path = singleBuilding["buildingHref"].substring(2); // TODO
                                    promiseArray.push(singleBuilding.file(path).async("text")); // TODO
                                } catch (e) {
                                    // skip
                                }
                            }
                        }
                    } catch (e) {
                        return reject(new InsightError("ALl kinds of errors inside try"));
                    }
                });
            }).catch(function (e) {
                // Log.trace("not zip");
                reject(new InsightError("This is not a zip"));
            });
        });
    }

    public getGeo(buildingList: any): Promise<any> {
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

    public getRoomInfo(nodes: any[]): any {
        let buildingMap: Map<string, any> = new Map<string, any>();
        let buildingFull: string;
        let buildingShort: string;
        let buildingAdr: string;
        let buildingHref: number;
        let buildingLat: number;
        let buildingLon: number;
        for (let singleN of nodes) {
            if (singleN.nodeName === "td" && singleN.attrs[0].name === "class") {
                if (singleN.attrs[0].value === "views-field views-field-title") {
                    buildingFull = singleN.childNodes[1].childNodes[0].value.trim();
                } else if (singleN.attrs[0].value === "views-field views-field-field-building-code") {
                    buildingShort = singleN.childNodes[1].childNodes[0].value.trim();
                } else if (singleN.attrs[0].value === "views-field views-field-field-building-address") {
                    buildingAdr = singleN.childNodes[1].childNodes[0].value.trim();
                } else if (singleN.attrs[0].value === "views-field views-field-nothing") {
                    buildingHref = singleN.childNodes[1].childNodes[0].value;
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
        return buildingList;
    }

    public getInside(nodes: any[]): any[] {
        let roomObj: any[] = [];
        if (nodes === undefined || nodes === null) {
            return roomObj;
        } else {
            for (let node of nodes) {
                if (node.nodeName === "tbody") {
                    for (let child of node.childNodes) {
                        roomObj.push(child);
                        return roomObj;
                    }
                } else {
                    roomObj = this.getInside(node.childNodes);
                    if (roomObj.length !== 0) {
                        return roomObj;
                    }
                }
            }
        }
    }
}

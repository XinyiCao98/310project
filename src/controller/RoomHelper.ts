import {InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";

export default class RoomHelper {

    constructor() {
        //
    }

    public addRoom(id: string, content: string, currZip: JSZip): Promise<string[]> {
        return new Promise((fulfill, reject) => {
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
                                    this.getRoomInfo(roomNode.childNodes);
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

    public getRoomInfo(nodes: any[]) {
        let buildingFull: string;
        let buildingShort: string;
        let buidingAdr: string;
        let buildingLat: number;
        let buildingLon: number;
        for (let singleN of nodes) {
            if (singleN.nodeName === "td") {
                //
            }
        }
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
